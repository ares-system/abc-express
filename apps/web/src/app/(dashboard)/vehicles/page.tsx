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
import { formatDate, formatNumber, cn, capitalize } from '@/lib/utils';
import {
  Truck,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  MapPin,
  Calendar,
  Gauge,
  Package,
  Eye,
  Fuel,
  Hash,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  capacityKg: number;
  capacityM3: number | null;
  fuelType: string;
  status: string;
  currentMileageKm: number;
  lastServiceDate: string | null;
  nextServiceDueKm: number | null;
  isActive: boolean;
  createdAt: string;
  branch: {
    id: string;
    code: string;
    name: string;
    city: string;
  } | null;
}

interface PaginatedResponse {
  data: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const VEHICLE_TYPES = [
  'MOTORCYCLE', 'VAN', 'PICKUP', 'TRUCK_SMALL', 'TRUCK_MEDIUM',
  'TRUCK_LARGE', 'TRUCK_TRAILER', 'CONTAINER',
] as const;

const VEHICLE_STATUSES = [
  'AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE',
] as const;

const STATUS_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  AVAILABLE: 'success',
  IN_USE: 'info',
  MAINTENANCE: 'warning',
  OUT_OF_SERVICE: 'danger',
};

// ─── Page ───────────────────────────────────────────────────

const VehiclesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const limit = 20;

  const queryParams = useMemo(() => {
    const parts: string[] = [`page=${page}`, `limit=${limit}`, 'sort=plateNumber'];
    if (debouncedSearch) parts.push(`search=${encodeURIComponent(debouncedSearch)}`);
    if (typeFilter) parts.push(`type=${typeFilter}`);
    if (statusFilter) parts.push(`status=${statusFilter}`);
    return parts.join('&');
  }, [page, debouncedSearch, typeFilter, statusFilter]);

  const { data: response, isLoading, error, refetch } = useApi<PaginatedResponse>(
    `/vehicles?${queryParams}`,
  );

  const vehicles = response?.data ?? [];
  const pagination = response?.pagination;
  const hasFilters = typeFilter || statusFilter;

  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const columns: Column<Vehicle>[] = [
    {
      key: 'plateNumber',
      header: 'Plate Number',
      render: (v) => (
        <span className="font-mono text-sm font-semibold text-surface-800">{v.plateNumber}</span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (v) => (
        <div>
          <p className="text-sm font-medium text-surface-700">
            {v.brand} {v.model}
          </p>
          <p className="text-xs text-surface-400">{v.year}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (v) => (
        <Badge variant="neutral">
          {capitalize(v.type.replace(/_/g, ' '))}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => (
        <Badge variant={STATUS_VARIANTS[v.status] ?? 'neutral'}>
          {capitalize(v.status.replace(/_/g, ' '))}
        </Badge>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (v) => (
        <div className="text-sm text-surface-600">
          <p>{formatNumber(v.capacityKg)} kg</p>
          {v.capacityM3 && (
            <p className="text-xs text-surface-400">{v.capacityM3.toFixed(1)} m³</p>
          )}
        </div>
      ),
    },
    {
      key: 'mileage',
      header: 'Mileage',
      render: (v) => (
        <span className="text-sm text-surface-600">
          {formatNumber(v.currentMileageKm)} km
        </span>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (v) =>
        v.branch ? (
          <div className="text-xs text-surface-600">
            <p className="font-medium">{v.branch.name}</p>
            <p className="text-surface-400">{v.branch.city}</p>
          </div>
        ) : (
          <span className="text-xs text-surface-400">Unassigned</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (v) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedVehicle(v); }}
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
        <Header title="Vehicles" />
        <div className="p-6"><PageLoading message="Loading vehicles..." /></div>
      </>
    );
  }

  if (error && !response) {
    return (
      <>
        <Header title="Vehicles" />
        <div className="p-6"><ErrorState message={error} onRetry={refetch} /></div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Vehicles"
        subtitle={`${pagination?.total ?? 0} fleet vehicles`}
        actions={
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        <Card padding="md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search plate number, brand..."
                className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-9 pr-3 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-800"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasFilters && <Badge variant="info" className="text-[10px]">Active</Badge>}
              <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-500">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All types</option>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{capitalize(t.replace(/_/g, ' '))}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-500">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All statuses</option>
                  {VEHICLE_STATUSES.map((s) => (
                    <option key={s} value={s}>{capitalize(s.replace(/_/g, ' '))}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-surface-400 hover:text-surface-600">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>

        {vehicles.length > 0 ? (
          <>
            <DataTable columns={columns} data={vehicles} onRowClick={setSelectedVehicle} keyExtractor={(v) => v.id} />
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
          <EmptyState icon={Truck} title="No vehicles found" description="Try adjusting your search or filters." />
        )}
      </div>

      <Modal open={!!selectedVehicle} onClose={() => setSelectedVehicle(null)} title="Vehicle Details" size="lg">
        {selectedVehicle && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-lg font-bold text-surface-800">{selectedVehicle.plateNumber}</p>
                <p className="text-sm text-surface-500">
                  {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="neutral">{capitalize(selectedVehicle.type.replace(/_/g, ' '))}</Badge>
                <Badge variant={STATUS_VARIANTS[selectedVehicle.status] ?? 'neutral'}>
                  {capitalize(selectedVehicle.status.replace(/_/g, ' '))}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={Package} label="Capacity" value={`${formatNumber(selectedVehicle.capacityKg)} kg`} />
              {selectedVehicle.capacityM3 && (
                <InfoRow icon={Package} label="Volume Capacity" value={`${selectedVehicle.capacityM3.toFixed(1)} m³`} />
              )}
              <InfoRow icon={Gauge} label="Current Mileage" value={`${formatNumber(selectedVehicle.currentMileageKm)} km`} />
              <InfoRow icon={Fuel} label="Fuel Type" value={capitalize(selectedVehicle.fuelType)} />
              {selectedVehicle.lastServiceDate && (
                <InfoRow icon={Calendar} label="Last Service" value={formatDate(selectedVehicle.lastServiceDate)} />
              )}
              {selectedVehicle.nextServiceDueKm && (
                <InfoRow icon={Gauge} label="Next Service Due" value={`${formatNumber(selectedVehicle.nextServiceDueKm)} km`} />
              )}
              {selectedVehicle.branch && (
                <InfoRow
                  icon={MapPin}
                  label="Assigned Branch"
                  value={`${selectedVehicle.branch.name}, ${selectedVehicle.branch.city}`}
                />
              )}
              <InfoRow icon={Calendar} label="Registered" value={formatDate(selectedVehicle.createdAt)} />
            </div>

            {selectedVehicle.nextServiceDueKm && selectedVehicle.currentMileageKm >= selectedVehicle.nextServiceDueKm && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This vehicle has exceeded its scheduled service mileage. Please schedule maintenance.
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs text-surface-400">
      <Icon className="h-3 w-3" />
      {label}
    </div>
    <p className="mt-0.5 text-sm font-medium text-surface-700">{value}</p>
  </div>
);

export default VehiclesPage;
