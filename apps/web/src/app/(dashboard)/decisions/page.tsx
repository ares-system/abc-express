'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardHeader,
  Badge,
  Button,
  Modal,
  DataTable,
  Pagination,
  PageLoading,
  ErrorState,
  EmptyState,
  type Column,
} from '@/components/ui';
import { useApi, useMutation } from '@/lib/hooks';
import {
  formatDateTime,
  formatRelative,
  getDecisionStatus,
  cn,
  capitalize,
} from '@/lib/utils';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Edit3,
  RefreshCw,
  Filter,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap,
  BarChart3,
  Eye,
  Package,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface Decision {
  id: string;
  type: string;
  status: string;
  recommendation: string;
  confidence: number;
  reasoning: string | null;
  humanAction: string | null;
  humanNotes: string | null;
  createdAt: string;
  updatedAt: string;
  shipment: {
    id: string;
    connoteNumber: string;
    status: string;
    serviceType: string;
  } | null;
  user: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface DecisionStats {
  total: number;
  pending: number;
  approved: number;
  overridden: number;
  rejected: number;
  avgConfidence: number;
  byType: { type: string; count: number }[];
}

interface PaginatedResponse {
  data: Decision[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Constants ──────────────────────────────────────────────

const DECISION_TYPES = [
  'ROUTE_OPTIMIZATION',
  'PRICING_ADJUSTMENT',
  'CAPACITY_PLANNING',
  'RISK_ASSESSMENT',
  'DELIVERY_PREDICTION',
  'COST_OPTIMIZATION',
  'DEMAND_FORECAST',
  'EXCEPTION_HANDLING',
] as const;

const DECISION_STATUSES = [
  'AI_RECOMMENDED',
  'HUMAN_APPROVED',
  'HUMAN_OVERRIDDEN',
  'HUMAN_REJECTED',
  'AUTO_APPLIED',
  'EXPIRED',
] as const;

const TYPE_ICONS: Record<string, typeof Brain> = {
  ROUTE_OPTIMIZATION: TrendingUp,
  PRICING_ADJUSTMENT: BarChart3,
  CAPACITY_PLANNING: Zap,
  RISK_ASSESSMENT: AlertTriangle,
  DELIVERY_PREDICTION: Clock,
  COST_OPTIMIZATION: BarChart3,
  DEMAND_FORECAST: TrendingUp,
  EXCEPTION_HANDLING: AlertTriangle,
  LOAD_CONSOLIDATION: Package,
};

// ─── Page ───────────────────────────────────────────────────

const DecisionsPage = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'override' | 'reject' | null>(null);
  const [humanNotes, setHumanNotes] = useState('');
  const [overrideRec, setOverrideRec] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const limit = 15;

  // ── Build query string ──────────────────────────────────

  const queryParams = useMemo(() => {
    const parts: string[] = [`page=${page}`, `limit=${limit}`, 'sort=-createdAt'];
    if (statusFilter) parts.push(`status=${statusFilter}`);
    if (typeFilter) parts.push(`type=${typeFilter}`);
    return parts.join('&');
  }, [page, statusFilter, typeFilter]);

  const { data: response, isLoading, error, refetch } = useApi<PaginatedResponse>(
    `/decisions?${queryParams}`,
    { refreshInterval: 10_000 },
  );

  const { data: stats, refetch: refetchStats } = useApi<DecisionStats>('/decisions/stats');

  // ── Mutations ───────────────────────────────────────────

  type DecisionStatusBody = {
    status: 'HUMAN_APPROVED' | 'HUMAN_OVERRIDDEN' | 'REJECTED';
    humanReasoning?: string;
    humanDecision?: Record<string, unknown>;
  };

  const decisionStatusMutation = useMutation<DecisionStatusBody, unknown>('PUT', '/decisions/');

  const decisions = response?.data ?? [];
  const pagination = response?.pagination;

  // ── Handlers ────────────────────────────────────────────

  const handleAction = async () => {
    if (!selectedDecision || !actionModal) return;

    const id = selectedDecision.id;
    try {
      if (actionModal === 'approve') {
        await decisionStatusMutation.mutate(
          { status: 'HUMAN_APPROVED', humanReasoning: humanNotes || undefined },
          `${id}/status`,
        );
      } else if (actionModal === 'override') {
        await decisionStatusMutation.mutate(
          {
            status: 'HUMAN_OVERRIDDEN',
            humanReasoning: humanNotes || undefined,
            humanDecision: { recommendation: overrideRec },
          },
          `${id}/status`,
        );
      } else {
        await decisionStatusMutation.mutate(
          { status: 'REJECTED', humanReasoning: humanNotes || undefined },
          `${id}/status`,
        );
      }

      setActionModal(null);
      setSelectedDecision(null);
      setHumanNotes('');
      setOverrideRec('');
      refetch();
      refetchStats();
    } catch {
      // error is handled by mutation state
    }
  };

  const openAction = (decision: Decision, action: 'approve' | 'override' | 'reject') => {
    setSelectedDecision(decision);
    setActionModal(action);
    setHumanNotes('');
    setOverrideRec('');
  };

  const openDetail = (decision: Decision) => {
    setSelectedDecision(decision);
    setDetailOpen(true);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setPage(1);
  };

  const hasFilters = statusFilter || typeFilter;

  // ── Columns ─────────────────────────────────────────────

  const columns: Column<Decision>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (d) => {
        const Icon = TYPE_ICONS[d.type] ?? Brain;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-surface-400" />
            <span className="text-sm font-medium text-surface-700">
              {capitalize(d.type.replace(/_/g, ' '))}
            </span>
          </div>
        );
      },
    },
    {
      key: 'recommendation',
      header: 'Recommendation',
      render: (d) => (
        <p className="max-w-xs truncate text-sm text-surface-600">{d.recommendation}</p>
      ),
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (d) => {
        const pct = Math.round(d.confidence * 100);
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-surface-100">
              <div
                className={cn(
                  'h-full rounded-full',
                  pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500',
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-surface-600">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'shipment',
      header: 'Shipment',
      render: (d) =>
        d.shipment ? (
          <span className="font-mono text-xs text-surface-600">
            {d.shipment.connoteNumber}
          </span>
        ) : (
          <span className="text-xs text-surface-400">-</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => {
        const st = getDecisionStatus(d.status);
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (d) => (
        <span className="text-xs text-surface-500">{formatRelative(d.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (d) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDetail(d);
            }}
            className="rounded p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {d.status === 'AI_RECOMMENDED' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openAction(d, 'approve');
                }}
                className="rounded p-1 text-green-500 hover:bg-green-50 hover:text-green-700"
                title="Approve"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openAction(d, 'override');
                }}
                className="rounded p-1 text-amber-500 hover:bg-amber-50 hover:text-amber-700"
                title="Override"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openAction(d, 'reject');
                }}
                className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                title="Reject"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────

  if (isLoading && !response) {
    return (
      <>
        <Header title="AI Decisions" />
        <div className="p-6">
          <PageLoading message="Loading decisions..." />
        </div>
      </>
    );
  }

  if (error && !response) {
    return (
      <>
        <Header title="AI Decisions" />
        <div className="p-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="AI Decisions"
        subtitle="Human-in-the-loop review and approval"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* ── Stats Cards ──────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Total"
              value={stats.total}
              icon={Brain}
              color="text-brand-600 bg-brand-50"
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Clock}
              color="text-amber-600 bg-amber-50"
              highlight={stats.pending > 0}
            />
            <StatCard
              label="Approved"
              value={stats.approved}
              icon={CheckCircle2}
              color="text-green-600 bg-green-50"
            />
            <StatCard
              label="Overridden"
              value={stats.overridden}
              icon={Edit3}
              color="text-blue-600 bg-blue-50"
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              icon={XCircle}
              color="text-red-600 bg-red-50"
            />
            <StatCard
              label="Avg Confidence"
              value={`${Math.round((stats.avgConfidence ?? 0) * 100)}%`}
              icon={BarChart3}
              color="text-purple-600 bg-purple-50"
            />
          </div>
        )}

        {/* ── Filters ──────────────────────────────────── */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-800"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasFilters && (
                <Badge variant="info" className="text-[10px]">
                  Active
                </Badge>
              )}
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')}
              />
            </button>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-surface-400 hover:text-surface-600"
              >
                Clear all
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-500">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All statuses</option>
                  {DECISION_STATUSES.map((s) => {
                    const st = getDecisionStatus(s);
                    return (
                      <option key={s} value={s}>
                        {st.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-surface-500">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All types</option>
                  {DECISION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {capitalize(t.replace(/_/g, ' '))}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* ── Table ────────────────────────────────────── */}
        {decisions.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              data={decisions}
              onRowClick={openDetail}
              keyExtractor={(d) => d.id}
            />
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={Brain}
            title="No decisions found"
            description={hasFilters ? 'Try adjusting your filters.' : 'AI decisions will appear here when generated.'}
            action={
              hasFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      {/* ── Detail Modal ───────────────────────────────── */}
      <Modal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedDecision(null);
        }}
        title="Decision Details"
        size="lg"
      >
        {selectedDecision && <DecisionDetail decision={selectedDecision} onAction={openAction} />}
      </Modal>

      {/* ── Action Modal ───────────────────────────────── */}
      <Modal
        open={!!actionModal}
        onClose={() => {
          setActionModal(null);
          setSelectedDecision(null);
          setHumanNotes('');
          setOverrideRec('');
        }}
        title={
          actionModal === 'approve'
            ? 'Approve Recommendation'
            : actionModal === 'override'
              ? 'Override Recommendation'
              : 'Reject Recommendation'
        }
      >
        {selectedDecision && (
          <div className="space-y-4">
            {/* Show current recommendation */}
            <div className="rounded-lg bg-surface-50 p-3">
              <p className="text-xs font-medium text-surface-400">AI Recommendation</p>
              <p className="mt-1 text-sm text-surface-700">{selectedDecision.recommendation}</p>
              <p className="mt-1 text-xs text-surface-400">
                Confidence: {Math.round(selectedDecision.confidence * 100)}%
              </p>
            </div>

            {/* Override: new recommendation */}
            {actionModal === 'override' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700">
                  Your Recommendation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={overrideRec}
                  onChange={(e) => setOverrideRec(e.target.value)}
                  rows={3}
                  placeholder="Enter your alternative recommendation..."
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">
                Notes {actionModal !== 'override' && '(optional)'}
              </label>
              <textarea
                value={humanNotes}
                onChange={(e) => setHumanNotes(e.target.value)}
                rows={3}
                placeholder={
                  actionModal === 'approve'
                    ? 'Any notes about this approval...'
                    : actionModal === 'reject'
                      ? 'Reason for rejection...'
                      : 'Why are you overriding this recommendation?'
                }
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {/* Error */}
            {decisionStatusMutation.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {decisionStatusMutation.error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setActionModal(null);
                  setSelectedDecision(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant={actionModal === 'reject' ? 'danger' : 'primary'}
                onClick={handleAction}
                disabled={
                  (actionModal === 'override' && !overrideRec.trim()) || decisionStatusMutation.isLoading
                }
              >
                {decisionStatusMutation.isLoading
                  ? 'Processing...'
                  : actionModal === 'approve'
                    ? 'Approve'
                    : actionModal === 'override'
                      ? 'Override'
                      : 'Reject'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── Sub-components ─────────────────────────────────────────

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: typeof Brain;
  color: string;
  highlight?: boolean;
}) => (
  <div
    className={cn(
      'rounded-xl border p-4',
      highlight ? 'border-amber-200 bg-amber-50/50' : 'border-surface-200 bg-white',
    )}
  >
    <div className={cn('inline-flex rounded-lg p-2', color)}>
      <Icon className="h-4 w-4" />
    </div>
    <p className="mt-2 text-2xl font-bold text-surface-800">{value}</p>
    <p className="text-xs text-surface-500">{label}</p>
  </div>
);

const DecisionDetail = ({
  decision,
  onAction,
}: {
  decision: Decision;
  onAction: (d: Decision, a: 'approve' | 'override' | 'reject') => void;
}) => {
  const st = getDecisionStatus(decision.status);
  const Icon = TYPE_ICONS[decision.type] ?? Brain;

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800">
              {capitalize(decision.type.replace(/_/g, ' '))}
            </p>
            {decision.shipment && (
              <p className="text-xs text-surface-400">
                Shipment: {decision.shipment.connoteNumber}
              </p>
            )}
          </div>
        </div>
        <Badge variant={st.variant}>{st.label}</Badge>
      </div>

      {/* Recommendation */}
      <div className="rounded-lg bg-surface-50 p-4">
        <p className="text-xs font-medium text-surface-400">Recommendation</p>
        <p className="mt-1 text-sm text-surface-700">{decision.recommendation}</p>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-surface-400">Confidence</p>
          <p className="text-sm font-semibold text-surface-700">
            {Math.round(decision.confidence * 100)}%
          </p>
        </div>
        <div className="mt-1.5 h-2 w-full rounded-full bg-surface-100">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              decision.confidence >= 0.8
                ? 'bg-green-500'
                : decision.confidence >= 0.6
                  ? 'bg-amber-500'
                  : 'bg-red-500',
            )}
            style={{ width: `${Math.round(decision.confidence * 100)}%` }}
          />
        </div>
      </div>

      {/* Reasoning */}
      {decision.reasoning && (
        <div className="rounded-lg border border-surface-100 p-4">
          <p className="text-xs font-medium text-surface-400">AI Reasoning</p>
          <p className="mt-1 text-sm text-surface-600 whitespace-pre-wrap">{decision.reasoning}</p>
        </div>
      )}

      {/* Human action info */}
      {decision.humanAction && (
        <div className="rounded-lg border border-surface-100 p-4">
          <p className="text-xs font-medium text-surface-400">Human Action</p>
          <p className="mt-1 text-sm font-medium text-surface-700">
            {capitalize(decision.humanAction.replace(/_/g, ' '))}
          </p>
          {decision.humanNotes && (
            <p className="mt-1 text-sm text-surface-600">{decision.humanNotes}</p>
          )}
          {decision.user && (
            <p className="mt-1 text-xs text-surface-400">
              By {decision.user.name} ({decision.user.role})
            </p>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="flex items-center gap-4 text-xs text-surface-400">
        <span>Created: {formatDateTime(decision.createdAt)}</span>
        <span>Updated: {formatDateTime(decision.updatedAt)}</span>
      </div>

      {/* Actions for pending decisions */}
      {decision.status === 'AI_RECOMMENDED' && (
        <div className="flex items-center gap-2 border-t border-surface-100 pt-4">
          <Button
            size="sm"
            onClick={() => onAction(decision, 'approve')}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction(decision, 'override')}
          >
            <Edit3 className="mr-1.5 h-4 w-4" />
            Override
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onAction(decision, 'reject')}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
};

export default DecisionsPage;
