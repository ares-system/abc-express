'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import {
  Card,
  Badge,
  Button,
  DataTable,
  Pagination,
  PageLoading,
  ErrorState,
  EmptyState,
  Modal,
  type Column,
} from '@/components/ui';
import { useApi, useDebounce } from '@/lib/hooks';
import { formatDate, formatCurrency, cn, capitalize } from '@/lib/utils';
import {
  Wallet,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Fuel,
  Users,
  Wrench,
  ShieldCheck,
  Package,
  Eye,
  Calendar,
  FileText,
  Truck,
  BarChart3,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface CostEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  notes: string | null;
  createdAt: string;
  shipment: {
    id: string;
    connoteNumber: string;
    serviceType: string;
  } | null;
  vehicle: {
    id: string;
    plateNumber: string;
    type: string;
  } | null;
  branch: {
    id: string;
    code: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    fullName: string;
  } | null;
}

/** Raw cost row from GET /api/costs. */
interface ApiCostRow {
  id: string;
  category: string;
  description: string;
  amount: number;
  vendorName: string | null;
  receiptNumber: string | null;
  incurredDate: string;
  createdAt: string;
  shipment: {
    id: string;
    connoteNumber: string;
    serviceType: string;
  } | null;
}

const mapRowToCostEntry = (row: ApiCostRow): CostEntry => ({
  id: row.id,
  category: row.category,
  description: row.description,
  amount: row.amount,
  currency: 'IDR',
  date: row.incurredDate,
  notes: [row.vendorName, row.receiptNumber].filter(Boolean).join(' · ') || null,
  createdAt: row.createdAt,
  shipment: row.shipment
    ? {
        id: row.shipment.id,
        connoteNumber: row.shipment.connoteNumber,
        serviceType: row.shipment.serviceType,
      }
    : null,
  vehicle: null,
  branch: null,
  createdBy: null,
});

/** Must match Prisma `CostCategory` enum. */
const COST_CATEGORIES = [
  'FUEL',
  'LABOR',
  'VEHICLE_MAINTENANCE',
  'TOLL',
  'PORT_FEES',
  'CUSTOMS',
  'INSURANCE',
  'PACKAGING',
  'STORAGE',
  'OVERHEAD',
  'OTHER',
] as const;

const CATEGORY_META: Record<string, { icon: typeof Fuel; color: string; label: string }> = {
  FUEL: { icon: Fuel, color: 'text-orange-600 bg-orange-50', label: 'Fuel' },
  LABOR: { icon: Users, color: 'text-blue-600 bg-blue-50', label: 'Labor' },
  VEHICLE_MAINTENANCE: { icon: Wrench, color: 'text-purple-600 bg-purple-50', label: 'Maintenance' },
  INSURANCE: { icon: ShieldCheck, color: 'text-green-600 bg-green-50', label: 'Insurance' },
  TOLL: { icon: TrendingUp, color: 'text-cyan-600 bg-cyan-50', label: 'Toll' },
  PACKAGING: { icon: Package, color: 'text-amber-600 bg-amber-50', label: 'Packaging' },
  STORAGE: { icon: Package, color: 'text-indigo-600 bg-indigo-50', label: 'Storage' },
  CUSTOMS: { icon: FileText, color: 'text-red-600 bg-red-50', label: 'Customs' },
  PORT_FEES: { icon: DollarSign, color: 'text-teal-600 bg-teal-50', label: 'Port fees' },
  OVERHEAD: { icon: BarChart3, color: 'text-pink-600 bg-pink-50', label: 'Overhead' },
  OTHER: { icon: Wallet, color: 'text-surface-600 bg-surface-50', label: 'Other' },
};

type CategoryMeta = (typeof CATEGORY_META)[keyof typeof CATEGORY_META];
const getCategoryMeta = (cat: string): CategoryMeta =>
  (CATEGORY_META[cat] ?? CATEGORY_META.OTHER) as CategoryMeta;

// ─── Page ───────────────────────────────────────────────────

const CostsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCost, setSelectedCost] = useState<CostEntry | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const limit = 20;

  const queryParams = useMemo(() => {
    const parts: string[] = [`page=${page}`, `limit=${limit}`, 'sort=-date'];
    if (debouncedSearch) parts.push(`search=${encodeURIComponent(debouncedSearch)}`);
    if (categoryFilter) parts.push(`category=${categoryFilter}`);
    return parts.join('&');
  }, [page, debouncedSearch, categoryFilter]);

  const { data: costRows, meta: pagination, isLoading, error, refetch } = useApi<ApiCostRow[]>(
    `/costs?${queryParams}`,
  );

  const costs = useMemo(() => (costRows ?? []).map(mapRowToCostEntry), [costRows]);

  // ── Page-level aggregation ────────────────────────────────
  const stats = useMemo(() => {
    const total = costs.reduce((s, c) => s + c.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const c of costs) {
      byCategory[c.category] = (byCategory[c.category] ?? 0) + c.amount;
    }
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    return {
      total,
      count: costs.length,
      avg: costs.length > 0 ? total / costs.length : 0,
      topCategory: topCategory ? topCategory[0] : null,
      topCategoryAmount: topCategory ? topCategory[1] : 0,
    };
  }, [costs]);

  const columns: Column<CostEntry>[] = [
    {
      key: 'category',
      header: 'Category',
      render: (c) => {
        const meta = getCategoryMeta(c.category);
        const Icon = meta.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={cn('rounded-lg p-1.5', meta.color)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium text-surface-700">{meta.label}</span>
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (c) => (
        <p className="max-w-[200px] truncate text-sm text-surface-600">
          {c.description}
        </p>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (c) => (
        <span className="text-sm font-semibold text-surface-800">
          {formatCurrency(c.amount)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (c) => (
        <span className="text-sm text-surface-600">{formatDate(c.date)}</span>
      ),
    },
    {
      key: 'shipment',
      header: 'Shipment',
      render: (c) =>
        c.shipment ? (
          <span className="font-mono text-xs text-surface-500">
            {c.shipment.connoteNumber}
          </span>
        ) : (
          <span className="text-xs text-surface-400">-</span>
        ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (c) =>
        c.vehicle ? (
          <div className="flex items-center gap-1.5">
            <Truck className="h-3 w-3 text-surface-400" />
            <span className="text-xs text-surface-600">{c.vehicle.plateNumber}</span>
          </div>
        ) : (
          <span className="text-xs text-surface-400">-</span>
        ),
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (c) =>
        c.branch ? (
          <span className="text-xs text-surface-600">{c.branch.code}</span>
        ) : (
          <span className="text-xs text-surface-400">-</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCost(c);
          }}
          className="rounded p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (isLoading && !costRows) {
    return (
      <>
        <Header title="Cost Entries" />
        <div className="p-6">
          <PageLoading message="Loading cost entries..." />
        </div>
      </>
    );
  }

  if (error && !costRows) {
    return (
      <>
        <Header title="Cost Entries" />
        <div className="p-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Cost Entries"
        subtitle={`${pagination?.total ?? 0} entries`}
        actions={
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label="Total Costs"
            value={formatCurrency(stats.total)}
            icon={DollarSign}
            color="text-brand-600 bg-brand-50"
          />
          <SummaryCard
            label="Entries (page)"
            value={String(stats.count)}
            icon={BarChart3}
            color="text-blue-600 bg-blue-50"
          />
          <SummaryCard
            label="Average"
            value={formatCurrency(stats.avg)}
            icon={TrendingDown}
            color="text-amber-600 bg-amber-50"
          />
          {stats.topCategory && (
            <SummaryCard
              label={`Top: ${getCategoryMeta(stats.topCategory).label}`}
              value={formatCurrency(stats.topCategoryAmount)}
              icon={getCategoryMeta(stats.topCategory).icon}
              color={getCategoryMeta(stats.topCategory).color}
            />
          )}
        </div>

        {/* Search & Filters */}
        <Card padding="md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search description..."
                className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-9 pr-3 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-800"
            >
              <Filter className="h-4 w-4" />
              Filters
              {categoryFilter && (
                <Badge variant="info" className="text-[10px]">
                  Active
                </Badge>
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  showFilters && 'rotate-180',
                )}
              />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-500">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All categories</option>
                  {COST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryMeta(cat).label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {categoryFilter && (
                  <button
                    onClick={() => {
                      setCategoryFilter('');
                      setPage(1);
                    }}
                    className="text-xs text-surface-400 hover:text-surface-600"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Table */}
        {costs.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              data={costs}
              onRowClick={setSelectedCost}
              keyExtractor={(c) => c.id}
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
            icon={Wallet}
            title="No cost entries found"
            description="Try adjusting your search or filters."
          />
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedCost}
        onClose={() => setSelectedCost(null)}
        title="Cost Entry Details"
        size="lg"
      >
        {selectedCost && <CostDetailContent cost={selectedCost} />}
      </Modal>
    </>
  );
};

// ─── Sub-components ─────────────────────────────────────────

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  color: string;
}) => (
  <div className="rounded-xl border border-surface-200 bg-white p-4">
    <div className={cn('inline-flex rounded-lg p-2', color)}>
      <Icon className="h-4 w-4" />
    </div>
    <p className="mt-2 text-lg font-bold text-surface-800">{value}</p>
    <p className="text-xs text-surface-500">{label}</p>
  </div>
);

const CostDetailContent = ({ cost }: { cost: CostEntry }) => {
  const meta = getCategoryMeta(cost.category);
  const Icon = meta.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-xl p-3', meta.color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-surface-800">{meta.label}</p>
            <p className="text-sm text-surface-500">{cost.description}</p>
          </div>
        </div>
        <p className="text-xl font-bold text-surface-800">
          {formatCurrency(cost.amount)}
        </p>
      </div>

      {/* Date & Creator */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-surface-400">
            <Calendar className="h-3 w-3" />
            Date
          </div>
          <p className="mt-0.5 text-sm font-medium text-surface-700">
            {formatDate(cost.date)}
          </p>
        </div>
        {cost.createdBy && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <Users className="h-3 w-3" />
              Created By
            </div>
            <p className="mt-0.5 text-sm font-medium text-surface-700">
              {cost.createdBy.fullName}
            </p>
          </div>
        )}
      </div>

      {/* Linked entities */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cost.shipment && (
          <div className="rounded-lg border border-surface-100 p-3">
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <Package className="h-3 w-3" />
              Shipment
            </div>
            <p className="mt-1 font-mono text-sm font-medium text-surface-700">
              {cost.shipment.connoteNumber}
            </p>
            <p className="text-xs text-surface-400">
              {capitalize(cost.shipment.serviceType.replace(/_/g, ' '))}
            </p>
          </div>
        )}
        {cost.vehicle && (
          <div className="rounded-lg border border-surface-100 p-3">
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <Truck className="h-3 w-3" />
              Vehicle
            </div>
            <p className="mt-1 text-sm font-medium text-surface-700">
              {cost.vehicle.plateNumber}
            </p>
            <p className="text-xs text-surface-400">
              {capitalize(cost.vehicle.type.replace(/_/g, ' '))}
            </p>
          </div>
        )}
        {cost.branch && (
          <div className="rounded-lg border border-surface-100 p-3">
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <FileText className="h-3 w-3" />
              Branch
            </div>
            <p className="mt-1 text-sm font-medium text-surface-700">
              {cost.branch.name}
            </p>
            <p className="text-xs text-surface-400">{cost.branch.code}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {cost.notes && (
        <div className="rounded-lg border border-surface-100 p-3">
          <p className="text-xs font-medium text-surface-400">Notes</p>
          <p className="mt-1 text-sm text-surface-600">{cost.notes}</p>
        </div>
      )}

      {/* Meta */}
      <div className="border-t border-surface-100 pt-3">
        <p className="text-xs text-surface-400">
          Created: {formatDate(cost.createdAt)} &middot; Currency: {cost.currency}
        </p>
      </div>
    </div>
  );
};

export default CostsPage;
