'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, Badge, Button, Modal, PageLoading, ErrorState } from '@/components/ui';
import { useApi, useMutation } from '@/lib/hooks';
import {
  formatDate,
  formatDateTime,
  formatRelative,
  formatCurrency,
  formatWeight,
  formatNumber,
  getShipmentStatus,
  getInvoiceStatus,
  getDecisionStatus,
  cn,
  capitalize,
} from '@/lib/utils';
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Phone,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  Brain,
  ChevronRight,
  RefreshCw,
  DollarSign,
  Scale,
  Boxes,
  Calendar,
  Building2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  region?: string;
}

interface ShipmentEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  branch: { code: string; name: string; city: string } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  createdAt: string;
}

interface CostEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

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
}

interface ShipmentDetail {
  id: string;
  connoteNumber: string;
  status: string;
  serviceType: string;
  description: string | null;
  weightKg: number;
  volumeM3: number | null;
  pieces: number;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  specialInstructions: string | null;
  declaredValue: number | null;
  isInsured: boolean;
  totalChargeAmount: number;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    code: string;
    name: string;
    type: string;
    companyName: string | null;
    phone: string | null;
  } | null;
  originBranch: Branch;
  destinationBranch: Branch;
  currentBranch: { id: string; code: string; name: string; city: string } | null;
  events: ShipmentEvent[];
  invoices: Invoice[];
  costEntries: CostEntry[];
  decisions: Decision[];
}

// ─── Status Transition Map ──────────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['BOOKED', 'CANCELLED'],
  BOOKED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'EXCEPTION'],
  IN_TRANSIT: ['AT_HUB', 'OUT_FOR_DELIVERY', 'EXCEPTION'],
  AT_HUB: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'EXCEPTION'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED', 'EXCEPTION'],
  EXCEPTION: ['IN_TRANSIT', 'AT_HUB', 'RETURNED', 'CANCELLED'],
  RETURNED: [],
  DELIVERED: [],
  CANCELLED: [],
};

// ─── Timeline event icon mapping ────────────────────────────

const EVENT_ICONS: Record<string, typeof Package> = {
  CREATED: Package,
  BOOKED: FileText,
  PICKED_UP: Truck,
  IN_TRANSIT: Truck,
  AT_HUB: Building2,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle2,
  EXCEPTION: AlertTriangle,
  RETURNED: AlertTriangle,
  CANCELLED: AlertTriangle,
};

// ─── Detail Page ────────────────────────────────────────────

const ShipmentDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedNextStatus, setSelectedNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const { data: shipment, isLoading, error, refetch } = useApi<ShipmentDetail>(
    `/shipments/${id}`,
    { refreshInterval: 15_000 },
  );

  const statusMutation = useMutation<{ status: string; description?: string }, unknown>(
    'PUT',
    '/shipments/',
  );

  const allowedNext = useMemo(
    () => (shipment ? ALLOWED_TRANSITIONS[shipment.status] ?? [] : []),
    [shipment],
  );

  const handleStatusUpdate = async () => {
    if (!selectedNextStatus) return;
    await statusMutation.mutate(
      {
        status: selectedNextStatus,
        description: statusNote || undefined,
      },
      `${id}/status`,
    );
    setStatusModalOpen(false);
    setSelectedNextStatus('');
    setStatusNote('');
    refetch();
  };

  // ─── Loading / Error ──────────────────────────────────────

  if (isLoading && !shipment) {
    return (
      <>
        <Header title="Shipment Detail" />
        <div className="p-6">
          <PageLoading message="Loading shipment..." />
        </div>
      </>
    );
  }

  if (error && !shipment) {
    return (
      <>
        <Header title="Shipment Detail" />
        <div className="p-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </>
    );
  }

  if (!shipment) return null;

  const st = getShipmentStatus(shipment.status);

  return (
    <>
      <Header
        title={shipment.connoteNumber}
        subtitle={`${shipment.serviceType.replace(/_/g, ' ')} shipment`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/shipments')}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            {allowedNext.length > 0 && (
              <Button size="sm" onClick={() => setStatusModalOpen(true)}>
                Update Status
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6 p-6">
        {/* ── Status Banner ────────────────────────────── */}
        <div
          className={cn(
            'flex items-center justify-between rounded-xl px-5 py-4',
            st.variant === 'success' && 'bg-green-50 border border-green-200',
            st.variant === 'warning' && 'bg-amber-50 border border-amber-200',
            st.variant === 'danger' && 'bg-red-50 border border-red-200',
            st.variant === 'info' && 'bg-blue-50 border border-blue-200',
            st.variant === 'neutral' && 'bg-surface-50 border border-surface-200',
          )}
        >
          <div className="flex items-center gap-3">
            <Badge variant={st.variant} className="text-sm px-3 py-1">
              {st.label}
            </Badge>
            {shipment.currentBranch && (
              <span className="flex items-center gap-1 text-sm text-surface-600">
                <MapPin className="h-3.5 w-3.5" />
                Currently at {shipment.currentBranch.name}, {shipment.currentBranch.city}
              </span>
            )}
          </div>
          {shipment.estimatedDeliveryDate && !shipment.actualDeliveryDate && (
            <span className="flex items-center gap-1 text-sm text-surface-500">
              <Calendar className="h-3.5 w-3.5" />
              ETA: {formatDate(shipment.estimatedDeliveryDate)}
            </span>
          )}
          {shipment.actualDeliveryDate && (
            <span className="flex items-center gap-1 text-sm text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Delivered: {formatDateTime(shipment.actualDeliveryDate)}
            </span>
          )}
        </div>

        {/* ── Main Grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Info Cards (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Shipment Info */}
            <Card padding="lg">
              <CardHeader title="Shipment Information" />
              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                <InfoItem icon={Scale} label="Weight" value={formatWeight(shipment.weightKg)} />
                <InfoItem icon={Boxes} label="Pieces" value={`${shipment.pieces} pcs`} />
                <InfoItem
                  icon={DollarSign}
                  label="Charge"
                  value={formatCurrency(shipment.totalChargeAmount)}
                />
                <InfoItem
                  icon={Shield}
                  label="Insurance"
                  value={shipment.isInsured ? 'Yes' : 'No'}
                />
                {shipment.volumeM3 && (
                  <InfoItem
                    icon={Package}
                    label="Volume"
                    value={`${shipment.volumeM3.toFixed(2)} m³`}
                  />
                )}
                {shipment.declaredValue && (
                  <InfoItem
                    icon={DollarSign}
                    label="Declared Value"
                    value={formatCurrency(shipment.declaredValue)}
                  />
                )}
                <InfoItem icon={Calendar} label="Created" value={formatDate(shipment.createdAt)} />
                {shipment.client && (
                  <InfoItem
                    icon={Building2}
                    label="Client"
                    value={shipment.client.companyName ?? shipment.client.name}
                    sub={shipment.client.code}
                  />
                )}
              </div>
              {shipment.description && (
                <div className="mt-4 rounded-lg bg-surface-50 p-3">
                  <p className="text-xs font-medium text-surface-400">Description</p>
                  <p className="mt-1 text-sm text-surface-700">{shipment.description}</p>
                </div>
              )}
              {shipment.specialInstructions && (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <p className="text-xs font-medium text-amber-600">Special Instructions</p>
                  <p className="mt-1 text-sm text-amber-800">{shipment.specialInstructions}</p>
                </div>
              )}
            </Card>

            {/* Sender / Receiver */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card padding="lg">
                <CardHeader title="Sender" />
                <div className="mt-3 space-y-2">
                  <ContactRow icon={User} value={shipment.senderName} />
                  <ContactRow icon={Phone} value={shipment.senderPhone} />
                  <ContactRow icon={MapPin} value={shipment.senderAddress} />
                </div>
              </Card>
              <Card padding="lg">
                <CardHeader title="Receiver" />
                <div className="mt-3 space-y-2">
                  <ContactRow icon={User} value={shipment.receiverName} />
                  <ContactRow icon={Phone} value={shipment.receiverPhone} />
                  <ContactRow icon={MapPin} value={shipment.receiverAddress} />
                </div>
              </Card>
            </div>

            {/* Route Info */}
            <Card padding="lg">
              <CardHeader title="Route" />
              <div className="mt-4 flex items-center gap-4">
                <BranchCard label="Origin" branch={shipment.originBranch} />
                <div className="flex flex-col items-center gap-1">
                  <div className="h-px w-12 bg-surface-300" />
                  <ChevronRight className="h-4 w-4 text-surface-400" />
                  <div className="h-px w-12 bg-surface-300" />
                </div>
                <BranchCard label="Destination" branch={shipment.destinationBranch} />
              </div>
            </Card>

            {/* Invoices */}
            {shipment.invoices.length > 0 && (
              <Card padding="lg">
                <CardHeader
                  title="Invoices"
                  subtitle={`${shipment.invoices.length} invoice(s)`}
                />
                <div className="mt-4 divide-y divide-surface-100">
                  {shipment.invoices.map((inv) => {
                    const invSt = getInvoiceStatus(inv.status);
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-surface-800">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-xs text-surface-400">
                            Due {formatDate(inv.dueDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-surface-800">
                              {formatCurrency(inv.totalAmount)}
                            </p>
                            {inv.paidAmount > 0 && (
                              <p className="text-xs text-green-600">
                                Paid: {formatCurrency(inv.paidAmount)}
                              </p>
                            )}
                          </div>
                          <Badge variant={invSt.variant}>{invSt.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Cost Entries */}
            {shipment.costEntries.length > 0 && (
              <Card padding="lg">
                <CardHeader
                  title="Cost Entries"
                  subtitle={`${shipment.costEntries.length} entries`}
                />
                <div className="mt-4 divide-y divide-surface-100">
                  {shipment.costEntries.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-surface-800">
                          {cost.description}
                        </p>
                        <p className="text-xs text-surface-400">
                          {capitalize(cost.category.replace(/_/g, ' '))}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-surface-800">
                        {formatCurrency(cost.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right: Timeline + AI Decisions (1 col) */}
          <div className="space-y-6">
            {/* Tracking Timeline */}
            <Card padding="lg">
              <CardHeader
                title="Tracking Timeline"
                subtitle={`${shipment.events.length} events`}
              />
              <div className="mt-4">
                {shipment.events.length > 0 ? (
                  <div className="relative ml-3">
                    {/* Vertical line */}
                    <div className="absolute left-0 top-2 bottom-2 w-px bg-surface-200" />

                    {[...shipment.events].reverse().map((event, i) => {
                      const Icon = EVENT_ICONS[event.type] ?? Clock;
                      const isFirst = i === 0;
                      return (
                        <div key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
                          {/* Icon */}
                          <div
                            className={cn(
                              'relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2',
                              isFirst
                                ? 'border-brand-500 bg-brand-50 text-brand-600'
                                : 'border-surface-200 bg-white text-surface-400',
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p
                              className={cn(
                                'text-sm font-medium',
                                isFirst ? 'text-surface-800' : 'text-surface-600',
                              )}
                            >
                              {event.description}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-surface-400">
                              <span>{formatDateTime(event.timestamp)}</span>
                              {event.branch && (
                                <>
                                  <span>·</span>
                                  <span>{event.branch.city}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-surface-400">
                    No tracking events yet
                  </p>
                )}
              </div>
            </Card>

            {/* AI Decisions */}
            {shipment.decisions.length > 0 && (
              <Card padding="lg">
                <CardHeader
                  title="AI Decisions"
                  subtitle="Recent recommendations"
                  action={
                    <Badge variant="info">
                      <Brain className="mr-1 inline h-3 w-3" />
                      AI
                    </Badge>
                  }
                />
                <div className="mt-4 space-y-3">
                  {shipment.decisions.map((dec) => {
                    const decSt = getDecisionStatus(dec.status);
                    return (
                      <div
                        key={dec.id}
                        className="rounded-lg border border-surface-100 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-surface-800">
                            {capitalize(dec.type.replace(/_/g, ' '))}
                          </p>
                          <Badge variant={decSt.variant} className="text-[10px]">
                            {decSt.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-surface-600">{dec.recommendation}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-surface-400">
                          <span>Confidence: {Math.round(dec.confidence * 100)}%</span>
                          <span>{formatRelative(dec.createdAt)}</span>
                        </div>
                        {dec.humanNotes && (
                          <div className="mt-2 rounded bg-surface-50 px-2 py-1 text-xs text-surface-500">
                            Human note: {dec.humanNotes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Update Modal ──────────────────────────── */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Shipment Status"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-surface-600">
              Current status:{' '}
              <Badge variant={st.variant} className="ml-1">
                {st.label}
              </Badge>
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">
              New Status
            </label>
            <select
              value={selectedNextStatus}
              onChange={(e) => setSelectedNextStatus(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select status...</option>
              {allowedNext.map((s) => {
                const info = getShipmentStatus(s);
                return (
                  <option key={s} value={s}>
                    {info.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">
              Note (optional)
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              placeholder="Add a note about this status change..."
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {statusMutation.error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {statusMutation.error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={!selectedNextStatus || statusMutation.isLoading}
            >
              {statusMutation.isLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ─── Sub-components ─────────────────────────────────────────

const InfoItem = ({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  sub?: string;
}) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs text-surface-400">
      <Icon className="h-3 w-3" />
      {label}
    </div>
    <p className="mt-0.5 text-sm font-medium text-surface-800">{value}</p>
    {sub && <p className="text-xs text-surface-400">{sub}</p>}
  </div>
);

const ContactRow = ({
  icon: Icon,
  value,
}: {
  icon: typeof User;
  value: string;
}) => (
  <div className="flex items-start gap-2">
    <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-surface-400" />
    <p className="text-sm text-surface-700">{value}</p>
  </div>
);

const BranchCard = ({
  label,
  branch,
}: {
  label: string;
  branch: Branch;
}) => (
  <div className="flex-1 rounded-lg border border-surface-200 p-3">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-surface-800">{branch.name}</p>
    <p className="text-xs text-surface-500">
      {branch.city}
      {branch.region && ` · ${branch.region}`}
    </p>
    <p className="mt-0.5 font-mono text-[10px] text-surface-400">{branch.code}</p>
  </div>
);

export default ShipmentDetailPage;
