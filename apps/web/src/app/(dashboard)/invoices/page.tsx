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
import {
  formatDate,
  formatCurrency,
  getInvoiceStatus,
  cn,
  capitalize,
} from '@/lib/utils';
import {
  FileText,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  DollarSign,
  Calendar,
  User,
  Package,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  paidAmount: number;
  dueDate: string;
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
  shipment: {
    id: string;
    connoteNumber: string;
    serviceType: string;
  } | null;
  client: {
    id: string;
    code: string;
    name: string;
    companyName: string | null;
  } | null;
}

interface PaginatedResponse {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const INVOICE_STATUSES = [
  'DRAFT', 'ISSUED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'WRITTEN_OFF',
] as const;

// ─── Page ───────────────────────────────────────────────────

const InvoicesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const limit = 20;

  const queryParams = useMemo(() => {
    const parts: string[] = [`page=${page}`, `limit=${limit}`, 'sort=-createdAt'];
    if (debouncedSearch) parts.push(`search=${encodeURIComponent(debouncedSearch)}`);
    if (statusFilter) parts.push(`status=${statusFilter}`);
    return parts.join('&');
  }, [page, debouncedSearch, statusFilter]);

  const { data: response, isLoading, error, refetch } = useApi<PaginatedResponse>(
    `/invoices?${queryParams}`,
  );

  const invoices = response?.data ?? [];
  const pagination = response?.pagination;

  // ── Summary stats from current page data ────────────────
  const pageTotals = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const paid = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const overdue = invoices.filter((i) => i.status === 'OVERDUE').length;
    return { total, paid, outstanding: total - paid, overdue };
  }, [invoices]);

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (inv) => (
        <span className="font-mono text-xs font-semibold text-brand-600">
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (inv) =>
        inv.client ? (
          <div>
            <p className="text-sm font-medium text-surface-700">
              {inv.client.companyName ?? inv.client.name}
            </p>
            <p className="text-xs text-surface-400">{inv.client.code}</p>
          </div>
        ) : (
          <span className="text-xs text-surface-400">-</span>
        ),
    },
    {
      key: 'shipment',
      header: 'Shipment',
      render: (inv) =>
        inv.shipment ? (
          <div>
            <p className="font-mono text-xs text-surface-600">{inv.shipment.connoteNumber}</p>
            <p className="text-[10px] text-surface-400">
              {capitalize(inv.shipment.serviceType.replace(/_/g, ' '))}
            </p>
          </div>
        ) : (
          <span className="text-xs text-surface-400">-</span>
        ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (inv) => (
        <div className="text-right">
          <p className="text-sm font-semibold text-surface-800">
            {formatCurrency(inv.totalAmount)}
          </p>
          {inv.taxAmount > 0 && (
            <p className="text-[10px] text-surface-400">
              Tax: {formatCurrency(inv.taxAmount)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      render: (inv) => (
        <div className="text-right">
          <p
            className={cn(
              'text-sm font-medium',
              inv.paidAmount >= inv.totalAmount
                ? 'text-green-600'
                : inv.paidAmount > 0
                  ? 'text-amber-600'
                  : 'text-surface-400',
            )}
          >
            {formatCurrency(inv.paidAmount)}
          </p>
          {inv.paidAmount > 0 && inv.paidAmount < inv.totalAmount && (
            <p className="text-[10px] text-surface-400">
              {Math.round((inv.paidAmount / inv.totalAmount) * 100)}% paid
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (inv) => {
        const isOverdue =
          inv.status !== 'PAID' &&
          inv.status !== 'CANCELLED' &&
          new Date(inv.dueDate) < new Date();
        return (
          <span
            className={cn(
              'text-sm',
              isOverdue ? 'font-medium text-red-600' : 'text-surface-600',
            )}
          >
            {formatDate(inv.dueDate)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (inv) => {
        const st = getInvoiceStatus(inv.status);
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (inv) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInvoice(inv);
          }}
          className="rounded p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (isLoading && !response) {
    return (
      <>
        <Header title="Invoices" />
        <div className="p-6">
          <PageLoading message="Loading invoices..." />
        </div>
      </>
    );
  }

  if (error && !response) {
    return (
      <>
        <Header title="Invoices" />
        <div className="p-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Invoices"
        subtitle={`${pagination?.total ?? 0} invoices`}
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
            label="Total Invoiced"
            value={formatCurrency(pageTotals.total)}
            icon={DollarSign}
            color="text-brand-600 bg-brand-50"
          />
          <SummaryCard
            label="Paid"
            value={formatCurrency(pageTotals.paid)}
            icon={CheckCircle2}
            color="text-green-600 bg-green-50"
          />
          <SummaryCard
            label="Outstanding"
            value={formatCurrency(pageTotals.outstanding)}
            icon={Clock}
            color="text-amber-600 bg-amber-50"
          />
          <SummaryCard
            label="Overdue"
            value={String(pageTotals.overdue)}
            icon={AlertTriangle}
            color="text-red-600 bg-red-50"
            highlight={pageTotals.overdue > 0}
          />
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
                placeholder="Search invoice number..."
                className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-9 pr-3 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-800"
            >
              <Filter className="h-4 w-4" />
              Filters
              {statusFilter && (
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
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All statuses</option>
                  {INVOICE_STATUSES.map((s) => {
                    const st = getInvoiceStatus(s);
                    return (
                      <option key={s} value={s}>
                        {st.label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex items-end">
                {statusFilter && (
                  <button
                    onClick={() => {
                      setStatusFilter('');
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
        {invoices.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              data={invoices}
              onRowClick={setSelectedInvoice}
              keyExtractor={(inv) => inv.id}
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
            icon={FileText}
            title="No invoices found"
            description="Try adjusting your search or filters."
          />
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="Invoice Details"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-lg font-bold text-surface-800">
                  {selectedInvoice.invoiceNumber}
                </p>
                <p className="text-xs text-surface-400">
                  Created: {formatDate(selectedInvoice.createdAt)}
                </p>
              </div>
              <Badge variant={getInvoiceStatus(selectedInvoice.status).variant}>
                {getInvoiceStatus(selectedInvoice.status).label}
              </Badge>
            </div>

            {/* Client & Shipment */}
            <div className="grid grid-cols-2 gap-4">
              {selectedInvoice.client && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-400">
                    <User className="h-3 w-3" />
                    Client
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-surface-700">
                    {selectedInvoice.client.companyName ?? selectedInvoice.client.name}
                  </p>
                  <p className="text-xs text-surface-400">{selectedInvoice.client.code}</p>
                </div>
              )}
              {selectedInvoice.shipment && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-400">
                    <Package className="h-3 w-3" />
                    Shipment
                  </div>
                  <p className="mt-0.5 font-mono text-sm font-medium text-surface-700">
                    {selectedInvoice.shipment.connoteNumber}
                  </p>
                  <p className="text-xs text-surface-400">
                    {capitalize(selectedInvoice.shipment.serviceType.replace(/_/g, ' '))}
                  </p>
                </div>
              )}
            </div>

            {/* Amounts */}
            <div className="rounded-lg bg-surface-50 p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-surface-800">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </p>
                  <p className="text-xs text-surface-500">Total Amount</p>
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      'text-xl font-bold',
                      selectedInvoice.paidAmount >= selectedInvoice.totalAmount
                        ? 'text-green-600'
                        : 'text-amber-600',
                    )}
                  >
                    {formatCurrency(selectedInvoice.paidAmount)}
                  </p>
                  <p className="text-xs text-surface-500">Paid</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-surface-800">
                    {formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}
                  </p>
                  <p className="text-xs text-surface-500">Outstanding</p>
                </div>
              </div>

              {/* Payment progress bar */}
              {selectedInvoice.totalAmount > 0 && (
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-surface-200">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        selectedInvoice.paidAmount >= selectedInvoice.totalAmount
                          ? 'bg-green-500'
                          : 'bg-amber-500',
                      )}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (selectedInvoice.paidAmount / selectedInvoice.totalAmount) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-center text-xs text-surface-400">
                    {Math.round(
                      (selectedInvoice.paidAmount / selectedInvoice.totalAmount) * 100,
                    )}
                    % paid
                  </p>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-surface-400">
                  <Calendar className="h-3 w-3" />
                  Due Date
                </div>
                <p
                  className={cn(
                    'mt-0.5 text-sm font-medium',
                    selectedInvoice.status !== 'PAID' &&
                      selectedInvoice.status !== 'CANCELLED' &&
                      new Date(selectedInvoice.dueDate) < new Date()
                      ? 'text-red-600'
                      : 'text-surface-700',
                  )}
                >
                  {formatDate(selectedInvoice.dueDate)}
                </p>
              </div>
              {selectedInvoice.paidDate && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Paid Date
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-green-600">
                    {formatDate(selectedInvoice.paidDate)}
                  </p>
                </div>
              )}
            </div>

            {/* Tax */}
            {selectedInvoice.taxAmount > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-surface-400">
                  <DollarSign className="h-3 w-3" />
                  Tax Amount
                </div>
                <p className="mt-0.5 text-sm text-surface-700">
                  {formatCurrency(selectedInvoice.taxAmount)}
                </p>
              </div>
            )}

            {/* Notes */}
            {selectedInvoice.notes && (
              <div className="rounded-lg border border-surface-100 p-3">
                <p className="text-xs font-medium text-surface-400">Notes</p>
                <p className="mt-1 text-sm text-surface-600">{selectedInvoice.notes}</p>
              </div>
            )}
          </div>
        )}
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
  highlight,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  color: string;
  highlight?: boolean;
}) => (
  <div
    className={cn(
      'rounded-xl border p-4',
      highlight ? 'border-red-200 bg-red-50/50' : 'border-surface-200 bg-white',
    )}
  >
    <div className={cn('inline-flex rounded-lg p-2', color)}>
      <Icon className="h-4 w-4" />
    </div>
    <p className="mt-2 text-lg font-bold text-surface-800">{value}</p>
    <p className="text-xs text-surface-500">{label}</p>
  </div>
);

export default InvoicesPage;
