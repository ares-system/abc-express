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
  Route,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  MapPin,
  Clock,
  Truck,
  Ship,
  Plane,
  Eye,
  Navigation,
  Timer,
  Package,
  DollarSign,
  ArrowRight,
  ArrowRightLeft,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface RouteData {
  id: string;
  code: string;
  name: string;
  transportMode: string;
  originCity: string;
  originProvince: string;
  destinationCity: string;
  destinationProvince: string;
  estimatedDuration: number;
  distance: number;
  basePrice: number;
  pricePerKg: number;
  transitDays: number;
  frequency: string;
  isActive: boolean;
  notes: string | null;
  stops: { city: string; province: string; order: number }[];
  shipments: { id: string }[];
  branches: { id: string }[];
}

interface PaginatedResponse {
  data: RouteData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const TRANSPORT_MODES = ['ROAD', 'SEA', 'AIR', 'RAIL'] as const;

const MODE_ICONS: Record<string, typeof Truck> = {
  ROAD: Truck,
  SEA: Ship,
  AIR: Plane,
  RAIL: ArrowRightLeft,
};

const MODE_COLORS: Record<string, string> = {
  ROAD: 'text-blue-600 bg-blue-50',
  SEA: 'text-teal-600 bg-teal-50',
  AIR: 'text-purple-600 bg-purple-50',
  RAIL: 'text-orange-600 bg-orange-50',
};

// ─── Page ───────────────────────────────────────────────────

const RoutesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const limit = 20;

  const queryParams = useMemo(() => {
    const parts: string[] = [`page=${page}`, `limit=${limit}`, 'sort=code'];
    if (debouncedSearch) parts.push(`search=${encodeURIComponent(debouncedSearch)}`);
    if (modeFilter) parts.push(`transportMode=${modeFilter}`);
    return parts.join('&');
  }, [page, debouncedSearch, modeFilter]);

  const { data: response, isLoading, error, refetch } = useApi<PaginatedResponse>(
    `/routes?${queryParams}`,
  );

  const routes = response?.data ?? [];
  const pagination = response?.pagination;

  // ── Page-level stats ────────────────────────────────
  const stats = useMemo(() => {
    const active = routes.filter((r) => r.isActive).length;
    const totalDistance = routes.reduce((s, r) => s + r.distance, 0);
    const totalPrice = routes.reduce((s, r) => s + r.basePrice, 0);
    const avgDuration = routes.length
      ? routes.reduce((s, r) => s + r.estimatedDuration, 0) / routes.length
      : 0;
    return {
      active,
      totalDistance,
      avgDuration: Math.round(avgDuration),
      avgPrice: routes.length ? totalPrice / routes.length : 0,
    };
  }, [routes]);

  const columns: Column<RouteData>[] = [
    {
      key: 'code',
      header: 'Route Code',
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-brand-600">
          {r.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Route Name',
      render: (r) => (
        <span className="text-sm font-medium text-surface-700">{r.name}</span>
      ),
    },
    {
      key: 'transportMode',
      header: 'Mode',
      render: (r) => {
        const Icon = MODE_ICONS[r.transportMode] ?? Truck;
        return (
          <div className="flex items-center gap-2">
            <div className={cn('rounded-lg p-1.5', MODE_COLORS[r.transportMode])}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium text-surface-600">
              {capitalize(r.transportMode.toLowerCase())}
            </span>
          </div>
        );
      },
    },
    {
      key: 'origin',
      header: 'Origin',
      render: (r) => (
        <div>
          <p className="text-xs font-medium text-surface-700">{r.originCity}</p>
          <p className="text-[10px] text-surface-400">{r.originProvince}</p>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (r) => (
        <div>
          <p className="text-xs font-medium text-surface-700">{r.destinationCity}</p>
          <p className="text-[10px] text-surface-400">{r.destinationProvince}</p>
        </div>
      ),
    },
    {
      key: 'estimatedDuration',
      header: 'Duration',
      render: (r) => (
        <div className="flex items-center gap-1 text-sm text-surface-600">
          <Clock className="h-3.5 w-3.5" />
          {r.estimatedDuration}h
        </div>
      ),
    },
    {
      key: 'distance',
      header: 'Distance',
      render: (r) => (
        <span className="text-sm text-surface-600">
          {r.distance.toLocaleString()} km
        </span>
      ),
    },
    {
      key: 'basePrice',
      header: 'Base Price',
      render: (r) => (
        <span className="text-sm font-semibold text-surface-700">
          {formatCurrency(r.basePrice)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={r.isActive ? 'success' : 'neutral'}>
          {r.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRoute(r);
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
        <Header title="Routes" />
        <div className="p-6">
          <PageLoading message="Loading routes..." />
        </div>
      </>
    );
  }

  if (error && !response) {
    return (
      <>
        <Header title="Routes" />
        <div className="p-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Routes"
        subtitle={`${pagination?.total ?? 0} routes`}
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
            label="Active Routes"
            value={`${stats.active}/${routes.length}`}
            icon={Navigation}
            color="text-green-600 bg-green-50"
          />
          <SummaryCard
            label="Total Distance"
            value={`${stats.totalDistance.toLocaleString()} km`}
            icon={Route}
            color="text-blue-600 bg-blue-50"
          />
          <SummaryCard
            label="Avg Duration"
            value={`${stats.avgDuration}h`}
            icon={Timer}
            color="text-amber-600 bg-amber-50"
          />
          <SummaryCard
            label="Avg Base Price"
            value={formatCurrency(stats.avgPrice)}
            icon={DollarSign}
            color="text-brand-600 bg-brand-50"
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
                placeholder="Search route name or code..."
                className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-9 pr-3 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-800"
            >
              <Filter className="h-4 w-4" />
              Filters
              {modeFilter && (
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
                  Transport Mode
                </label>
                <select
                  value={modeFilter}
                  onChange={(e) => {
                    setModeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All modes</option>
                  {TRANSPORT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {capitalize(mode.toLowerCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {modeFilter && (
                  <button
                    onClick={() => {
                      setModeFilter('');
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
        {routes.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              data={routes}
              onRowClick={setSelectedRoute}
              keyExtractor={(r) => r.id}
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
            icon={Route}
            title="No routes found"
            description="Try adjusting your search or filters."
          />
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedRoute}
        onClose={() => setSelectedRoute(null)}
        title="Route Details"
        size="lg"
      >
        {selectedRoute && <RouteDetailContent route={selectedRoute} />}
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
  icon: typeof Route;
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

const RouteDetailContent = ({ route }: { route: RouteData }) => {
  const Icon = MODE_ICONS[route.transportMode] ?? Truck;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-xl p-3', MODE_COLORS[route.transportMode])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-surface-800">{route.code}</p>
            <p className="text-sm text-surface-500">{route.name}</p>
          </div>
        </div>
        <Badge variant={route.isActive ? 'success' : 'neutral'}>
          {route.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Route visualization */}
      <div className="flex items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 p-4">
        <div className="flex-1 text-center">
          <p className="text-xs text-surface-400">Origin</p>
          <p className="font-medium text-surface-700">{route.originCity}</p>
          <p className="text-xs text-surface-400">{route.originProvince}</p>
        </div>
        <div className="flex flex-col items-center">
          <ArrowRight className="h-5 w-5 text-brand-400" />
          <p className="text-[10px] text-surface-400">
            {route.distance.toLocaleString()} km
          </p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xs text-surface-400">Destination</p>
          <p className="font-medium text-surface-700">{route.destinationCity}</p>
          <p className="text-xs text-surface-400">{route.destinationProvince}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-surface-100 p-3 text-center">
          <Clock className="mx-auto h-4 w-4 text-surface-400" />
          <p className="mt-1 text-lg font-bold text-surface-800">
            {route.estimatedDuration}h
          </p>
          <p className="text-xs text-surface-400">Duration</p>
        </div>
        <div className="rounded-lg border border-surface-100 p-3 text-center">
          <Navigation className="mx-auto h-4 w-4 text-surface-400" />
          <p className="mt-1 text-lg font-bold text-surface-800">
            {route.distance.toLocaleString()}
          </p>
          <p className="text-xs text-surface-400">km</p>
        </div>
        <div className="rounded-lg border border-surface-100 p-3 text-center">
          <Timer className="mx-auto h-4 w-4 text-surface-400" />
          <p className="mt-1 text-lg font-bold text-surface-800">{route.transitDays}</p>
          <p className="text-xs text-surface-400">Transit Days</p>
        </div>
        <div className="rounded-lg border border-surface-100 p-3 text-center">
          <Package className="mx-auto h-4 w-4 text-surface-400" />
          <p className="mt-1 text-lg font-bold text-surface-800">
            {route.pricePerKg.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-surface-400">/kg</p>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-lg bg-surface-50 p-4">
        <p className="mb-2 text-xs font-medium text-surface-400">Pricing</p>
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-surface-500">Base Price</p>
            <p className="text-lg font-bold text-surface-800">
              {formatCurrency(route.basePrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-surface-500">Price per kg</p>
            <p className="text-lg font-bold text-surface-800">
              {formatCurrency(route.pricePerKg)}
            </p>
          </div>
        </div>
      </div>

      {/* Stops */}
      {route.stops && route.stops.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-surface-400">Stops</p>
          <div className="space-y-2">
            {route.stops
              .sort((a, b) => a.order - b.order)
              .map((stop, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-surface-100 p-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-100 text-xs font-medium text-surface-600">
                    {stop.order}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-700">{stop.city}</p>
                    <p className="text-xs text-surface-400">{stop.province}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Frequency */}
      {route.frequency && (
        <div className="flex items-center gap-2 text-sm text-surface-600">
          <Timer className="h-4 w-4" />
          <span>Frequency: {route.frequency}</span>
        </div>
      )}

      {/* Notes */}
      {route.notes && (
        <div className="rounded-lg border border-surface-100 p-3">
          <p className="text-xs font-medium text-surface-400">Notes</p>
          <p className="mt-1 text-sm text-surface-600">{route.notes}</p>
        </div>
      )}

      {/* Linked counts */}
      <div className="flex gap-4 text-xs text-surface-400">
        <span>{route.shipments?.length ?? 0} shipments</span>
        <span>{route.branches?.length ?? 0} branches</span>
      </div>
    </div>
  );
};

export default RoutesPage;