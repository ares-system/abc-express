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
  Input,
  Modal,
  type Column,
} from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { useDebounce } from '@/lib/hooks';
import { cn, capitalize } from '@/lib/utils';
import {
  Building2,
  MapPin,
  Phone,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  Users,
  Truck,
  Package,
  Eye,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface Branch {
  id: string;
  code: string;
  name: string;
  type: string;
  city: string;
  province: string;
  region: string;
  address: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  _count?: {
    originShipments: number;
    destinationShipments: number;
    users: number;
    vehicles: number;
  };
}

interface PaginatedResponse {
  data: Branch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const BRANCH_TYPES = ['HUB', 'BRANCH', 'AGENT', 'SUB_AGENT'] as const;
const REGIONS = [
  'SUMATERA', 'JAWA', 'KALIMANTAN', 'SULAWESI', 'BALI_NUSATENGGARA', 'MALUKU_PAPUA',
] as const;

// ─── Page ───────────────────────────────────────────────────

const BranchesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const limit = 20;

  const queryParams = useMemo(() => {
    const parts: string[] = [`page=${page}`, `limit=${limit}`, 'sort=code'];
    if (debouncedSearch) parts.push(`search=${encodeURIComponent(debouncedSearch)}`);
    if (typeFilter) parts.push(`type=${typeFilter}`);
    if (regionFilter) parts.push(`region=${regionFilter}`);
    return parts.join('&');
  }, [page, debouncedSearch, typeFilter, regionFilter]);

  const { data: response, isLoading, error, refetch } = useApi<PaginatedResponse>(
    `/branches?${queryParams}`,
  );

  const branches = response?.data ?? [];
  const pagination = response?.pagination;
  const hasFilters = typeFilter || regionFilter;

  const clearFilters = () => {
    setTypeFilter('');
    setRegionFilter('');
    setPage(1);
  };

  const columns: Column<Branch>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (b) => (
        <span className="font-mono text-xs font-semibold text-brand-600">{b.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Branch Name',
      render: (b) => (
        <div>
          <p className="text-sm font-medium text-surface-800">{b.name}</p>
          <p className="text-xs text-surface-400">{b.city}, {b.province}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (b) => (
        <Badge
          variant={
            b.type === 'HUB' ? 'info' : b.type === 'BRANCH' ? 'success' : 'neutral'
          }
        >
          {b.type}
        </Badge>
      ),
    },
    {
      key: 'region',
      header: 'Region',
      render: (b) => (
        <span className="text-sm text-surface-600">
          {capitalize(b.region.replace(/_/g, ' '))}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (b) => (
        <span className="text-sm text-surface-600">{b.phone ?? '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <Badge variant={b.isActive ? 'success' : 'danger'}>
          {b.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'stats',
      header: 'Activity',
      render: (b) =>
        b._count ? (
          <div className="flex items-center gap-3 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {(b._count.originShipments ?? 0) + (b._count.destinationShipments ?? 0)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {b._count.users ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {b._count.vehicles ?? 0}
            </span>
          </div>
        ) : (
          <span className="text-xs text-surface-400">-</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (b) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBranch(b);
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
        <Header title="Branches" />
        <div className="p-6"><PageLoading message="Loading branches..." /></div>
      </>
    );
  }

  if (error && !response) {
    return (
      <>
        <Header title="Branches" />
        <div className="p-6"><ErrorState message={error} onRetry={refetch} /></div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Branches"
        subtitle={`${pagination?.total ?? 0} branches across Indonesia`}
        actions={
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        {/* Search & Filters */}
        <Card padding="md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search branches..."
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
                  {BRANCH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-500">Region</label>
                <select
                  value={regionFilter}
                  onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">All regions</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{capitalize(r.replace(/_/g, ' '))}</option>
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

        {branches.length > 0 ? (
          <>
            <DataTable columns={columns} data={branches} onRowClick={setSelectedBranch} keyExtractor={(b) => b.id} />
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
          <EmptyState icon={Building2} title="No branches found" description="Try adjusting your search or filters." />
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!selectedBranch} onClose={() => setSelectedBranch(null)} title="Branch Details" size="lg">
        {selectedBranch && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm font-semibold text-brand-600">{selectedBranch.code}</p>
                <p className="text-lg font-bold text-surface-800">{selectedBranch.name}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={selectedBranch.type === 'HUB' ? 'info' : selectedBranch.type === 'BRANCH' ? 'success' : 'neutral'}>
                  {selectedBranch.type}
                </Badge>
                <Badge variant={selectedBranch.isActive ? 'success' : 'danger'}>
                  {selectedBranch.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow icon={MapPin} label="Address" value={selectedBranch.address} />
              <DetailRow icon={MapPin} label="City" value={`${selectedBranch.city}, ${selectedBranch.province}`} />
              <DetailRow icon={Building2} label="Region" value={capitalize(selectedBranch.region.replace(/_/g, ' '))} />
              {selectedBranch.phone && <DetailRow icon={Phone} label="Phone" value={selectedBranch.phone} />}
              {selectedBranch.email && <DetailRow icon={Building2} label="Email" value={selectedBranch.email} />}
            </div>
            {selectedBranch._count && (
              <div className="grid grid-cols-3 gap-4 rounded-lg bg-surface-50 p-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-surface-800">
                    {(selectedBranch._count.originShipments ?? 0) + (selectedBranch._count.destinationShipments ?? 0)}
                  </p>
                  <p className="text-xs text-surface-500">Shipments</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-surface-800">{selectedBranch._count.users ?? 0}</p>
                  <p className="text-xs text-surface-500">Users</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-surface-800">{selectedBranch._count.vehicles ?? 0}</p>
                  <p className="text-xs text-surface-500">Vehicles</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs text-surface-400">
      <Icon className="h-3 w-3" />
      {label}
    </div>
    <p className="mt-0.5 text-sm text-surface-700">{value}</p>
  </div>
);

export default BranchesPage;
