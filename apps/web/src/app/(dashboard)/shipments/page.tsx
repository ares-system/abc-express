'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { DataTable, Pagination, Badge, Card, Input, Select, Button, EmptyState, ErrorState, type Column } from '@/components/ui';
import { useApi, useDebounce } from '@/lib/hooks';
import {
  formatDate,
  formatWeight,
  formatCurrency,
  getShipmentStatus,
  cn,
  truncate,
} from '@/lib/utils';
import {
  Package,
  Search,
  Filter,
  X,
  Download,
  Plus,
  MapPin,
  ArrowRight,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface ShipmentRow {
  id: string;
  connoteNumber: string;
  status: string;
  serviceType: string;
  description: string | null;
  weightKg: number;
  volumeM3: number | null;
  pieces: number;
  senderName: string;
  receiverName: string;
  isInsured: boolean;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  createdAt: string;
  client: { id: string; code: string; name: string; type: string } | null;
  originBranch: { id: string; code: string; name: string; city: string } | null;
  destinationBranch: { id: string; code: string; name: string; city: string } | null;
  currentBranch: { id: string; code: string; name: string; city: string } | null;
}

interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Constants ──────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'AT_HUB', label: 'At Hub' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'EXCEPTION', label: 'Exception' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SERVICE_TYPE_OPTIONS = [
  { value: '', label: 'All Services' },
  { value: 'REGULAR_CARGO', label: 'Regular Cargo' },
  { value: 'EXPRESS_CARGO', label: 'Express Cargo' },
  { value: 'PROJECT_CARGO', label: 'Project Cargo' },
  { value: 'HEAVY_EQUIPMENT', label: 'Heavy Equipment' },
  { value: 'VEHICLE_TRANSPORT', label: 'Vehicle Transport' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'IMPORT', label: 'Import' },
];

const SORT_MAP: Record<string, string> = {
  connoteNumber: 'connoteNumber',
  status: 'status',
  serviceType: 'serviceType',
  weightKg: 'weightKg',
  createdAt: 'createdAt',
};

// ─── Page Component ─────────────────────────────────────────

const ShipmentsPage = () => {
  const router = useRouter();

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Sort state
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const debouncedSearch = useDebounce(search, 400);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
      sortBy: SORT_MAP[sortKey] ?? 'createdAt',
      sortDir,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter) params.status = statusFilter;
    if (serviceTypeFilter) params.serviceType = serviceTypeFilter;
    return params;
  }, [page, limit, sortKey, sortDir, debouncedSearch, statusFilter, serviceTypeFilter]);

  const { data, meta, isLoading, error, refetch } = useApi<ShipmentRow[]>('/shipments', {
    params: queryParams,
    refreshInterval: 30_000,
  });

  const shipments = data ?? [];
  const paginationMeta = meta as ApiMeta | undefined;

  // Handlers
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
      setPage(1);
    },
    [sortKey],
  );

  const handleRowClick = useCallback(
    (row: ShipmentRow) => {
      router.push(`/shipments/${row.id}`);
    },
    [router],
  );

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setServiceTypeFilter('');
    setPage(1);
  };

  const hasActiveFilters = !!debouncedSearch || !!statusFilter || !!serviceTypeFilter;

  // ─── Column definitions ───────────────────────────────────

  const columns: Column<ShipmentRow>[] = useMemo(
    () => [
      {
        key: 'connoteNumber',
        header: 'Connote',
        sortable: true,
        render: (row) => (
          <div>
            <p className="font-mono text-sm font-semibold text-brand-700">
              {row.connoteNumber}
            </p>
            {row.client && (
              <p className="mt-0.5 text-xs text-surface-400">{row.client.code}</p>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => {
          const st = getShipmentStatus(row.status);
          return <Badge variant={st.variant}>{st.label}</Badge>;
        },
      },
      {
        key: 'serviceType',
        header: 'Service',
        sortable: true,
        render: (row) => (
          <span className="text-sm text-surface-600">
            {row.serviceType.replace(/_/g, ' ')}
          </span>
        ),
      },
      {
        key: 'route',
        header: 'Route',
        render: (row) => (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-surface-700" title={row.originBranch?.name}>
              {row.originBranch?.city ?? '—'}
            </span>
            <ArrowRight className="h-3 w-3 flex-shrink-0 text-surface-300" />
            <span className="font-medium text-surface-700" title={row.destinationBranch?.name}>
              {row.destinationBranch?.city ?? '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'sender',
        header: 'Sender / Receiver',
        render: (row) => (
          <div className="max-w-[160px]">
            <p className="truncate text-sm text-surface-700">{row.senderName}</p>
            <p className="truncate text-xs text-surface-400">{row.receiverName}</p>
          </div>
        ),
      },
      {
        key: 'weightKg',
        header: 'Weight',
        sortable: true,
        className: 'text-right',
        render: (row) => (
          <div className="text-right">
            <p className="text-sm text-surface-700">{formatWeight(row.weightKg)}</p>
            <p className="text-xs text-surface-400">{row.pieces} pcs</p>
          </div>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortable: true,
        render: (row) => (
          <div>
            <p className="text-sm text-surface-600">{formatDate(row.createdAt)}</p>
            {row.isInsured && (
              <Badge variant="info" className="mt-0.5 text-[10px]">
                Insured
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: 'currentBranch',
        header: 'Current Location',
        render: (row) =>
          row.currentBranch ? (
            <span className="inline-flex items-center gap-1 text-xs text-surface-500">
              <MapPin className="h-3 w-3" />
              {row.currentBranch.city}
            </span>
          ) : (
            <span className="text-xs text-surface-300">—</span>
          ),
      },
    ],
    [],
  );

  // ─── Render ───────────────────────────────────────────────

  if (error && !data) {
    return (
      <>
        <Header title="Shipments" />
        <div className="p-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Shipments"
        subtitle={
          paginationMeta
            ? `${paginationMeta.total.toLocaleString()} shipments`
            : 'Loading...'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refetch} aria-label="Refresh">
              <Package className="mr-1.5 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => router.push('/shipments/new')}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Shipment
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <Card>
          {/* ── Toolbar ──────────────────────────────────── */}
          <div className="flex flex-col gap-3 border-b border-surface-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search connote, sender, receiver..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-10 pr-4 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter toggles */}
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                    Active
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* ── Filters panel ────────────────────────────── */}
          {showFilters && (
            <div className="grid grid-cols-1 gap-3 border-b border-surface-100 bg-surface-50 p-4 sm:grid-cols-3">
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
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-500">
                  Service Type
                </label>
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => {
                    setServiceTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {SERVICE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          )}

          {/* ── Data Table ───────────────────────────────── */}
          <DataTable
            columns={columns}
            data={shipments}
            keyExtractor={(row) => row.id}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onRowClick={handleRowClick}
            isLoading={isLoading && !data}
            emptyMessage={
              hasActiveFilters
                ? 'No shipments match your filters.'
                : 'No shipments found. Create your first shipment.'
            }
          />

          {/* ── Pagination ───────────────────────────────── */}
          {paginationMeta && paginationMeta.totalPages > 1 && (
            <Pagination
              page={paginationMeta.page}
              totalPages={paginationMeta.totalPages}
              total={paginationMeta.total}
              limit={paginationMeta.limit}
              onPageChange={setPage}
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default ShipmentsPage;
