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
import { useApi } from '@/lib/hooks';
import { useDebounce } from '@/lib/hooks';
import { formatDate, formatCurrency, cn, capitalize } from '@/lib/utils';
import {
  Users,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  DollarSign,
  Eye,
  Calendar,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface Client {
  id: string;
  code: string;
  name: string;
  type: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  npwp: string | null;
  creditLimit: number | null;
  currentBalance: number;
  paymentTermDays: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    shipments: number;
    invoices: number;
  };
}

interface PaginatedResponse {
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const CLIENT_TYPES = ['INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'AGENT'] as const;

// ─── Page ───────────────────────────────────────────────────

const ClientsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const limit = 20;

  const queryParams = useMemo(() => {
    const parts: string[] = [`page=${page}`, `limit=${limit}`, 'sort=code'];
    if (debouncedSearch) parts.push(`search=${encodeURIComponent(debouncedSearch)}`);
    if (typeFilter) parts.push(`type=${typeFilter}`);
    return parts.join('&');
  }, [page, debouncedSearch, typeFilter]);

  const { data: response, isLoading, error, refetch } = useApi<PaginatedResponse>(
    `/clients?${queryParams}`,
  );

  const clients = response?.data ?? [];
  const pagination = response?.pagination;

  const columns: Column<Client>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (c) => (
        <span className="font-mono text-xs font-semibold text-brand-600">{c.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <div>
          <p className="text-sm font-medium text-surface-800">{c.name}</p>
          {c.companyName && (
            <p className="text-xs text-surface-400">{c.companyName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => (
        <Badge
          variant={
            c.type === 'CORPORATE'
              ? 'info'
              : c.type === 'GOVERNMENT'
                ? 'warning'
                : c.type === 'AGENT'
                  ? 'success'
                  : 'neutral'
          }
        >
          {capitalize(c.type)}
        </Badge>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (c) => (
        <div className="text-xs text-surface-600">
          {c.phone && <p>{c.phone}</p>}
          {c.email && <p className="text-surface-400">{c.email}</p>}
          {!c.phone && !c.email && <span className="text-surface-400">-</span>}
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      render: (c) =>
        c.city ? (
          <span className="text-sm text-surface-600">
            {c.city}
            {c.province ? `, ${c.province}` : ''}
          </span>
        ) : (
          <span className="text-sm text-surface-400">-</span>
        ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (c) => (
        <div className="text-right">
          <p className="text-sm font-medium text-surface-800">
            {formatCurrency(c.currentBalance)}
          </p>
          {c.creditLimit && (
            <p className="text-[10px] text-surface-400">
              Limit: {formatCurrency(c.creditLimit)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'shipments',
      header: 'Shipments',
      render: (c) => (
        <span className="text-sm text-surface-600">{c._count?.shipments ?? 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge variant={c.isActive ? 'success' : 'danger'}>
          {c.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedClient(c); }}
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
        <Header title="Clients" />
        <div className="p-6"><PageLoading message="Loading clients..." /></div>
      </>
    );
  }

  if (error && !response) {
    return (
      <>
        <Header title="Clients" />
        <div className="p-6"><ErrorState message={error} onRetry={refetch} /></div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Clients"
        subtitle={`${pagination?.total ?? 0} registered clients`}
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
                placeholder="Search clients..."
                className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-9 pr-3 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-800"
            >
              <Filter className="h-4 w-4" />
              Filters
              {typeFilter && <Badge variant="info" className="text-[10px]">Active</Badge>}
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
                  {CLIENT_TYPES.map((t) => (
                    <option key={t} value={t}>{capitalize(t)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {typeFilter && (
                  <button onClick={() => { setTypeFilter(''); setPage(1); }} className="text-xs text-surface-400 hover:text-surface-600">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>

        {clients.length > 0 ? (
          <>
            <DataTable columns={columns} data={clients} onRowClick={setSelectedClient} keyExtractor={(c) => c.id} />
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
          <EmptyState icon={Users} title="No clients found" description="Try adjusting your search or filters." />
        )}
      </div>

      <Modal open={!!selectedClient} onClose={() => setSelectedClient(null)} title="Client Details" size="lg">
        {selectedClient && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm font-semibold text-brand-600">{selectedClient.code}</p>
                <p className="text-lg font-bold text-surface-800">{selectedClient.name}</p>
                {selectedClient.companyName && (
                  <p className="text-sm text-surface-500">{selectedClient.companyName}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant={selectedClient.type === 'CORPORATE' ? 'info' : selectedClient.type === 'GOVERNMENT' ? 'warning' : 'neutral'}>
                  {capitalize(selectedClient.type)}
                </Badge>
                <Badge variant={selectedClient.isActive ? 'success' : 'danger'}>
                  {selectedClient.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedClient.phone && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-400"><Phone className="h-3 w-3" />Phone</div>
                  <p className="mt-0.5 text-sm text-surface-700">{selectedClient.phone}</p>
                </div>
              )}
              {selectedClient.email && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-400"><Mail className="h-3 w-3" />Email</div>
                  <p className="mt-0.5 text-sm text-surface-700">{selectedClient.email}</p>
                </div>
              )}
              {selectedClient.address && (
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5 text-xs text-surface-400"><MapPin className="h-3 w-3" />Address</div>
                  <p className="mt-0.5 text-sm text-surface-700">
                    {selectedClient.address}
                    {selectedClient.city ? `, ${selectedClient.city}` : ''}
                    {selectedClient.province ? `, ${selectedClient.province}` : ''}
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-surface-400"><Calendar className="h-3 w-3" />Payment Terms</div>
                <p className="mt-0.5 text-sm text-surface-700">{selectedClient.paymentTermDays} days</p>
              </div>
              {selectedClient.npwp && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-400"><Building2 className="h-3 w-3" />NPWP</div>
                  <p className="mt-0.5 font-mono text-sm text-surface-700">{selectedClient.npwp}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-lg bg-surface-50 p-4">
              <div className="text-center">
                <p className="text-xl font-bold text-surface-800">{formatCurrency(selectedClient.currentBalance)}</p>
                <p className="text-xs text-surface-500">Balance</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-surface-800">{selectedClient.creditLimit ? formatCurrency(selectedClient.creditLimit) : '-'}</p>
                <p className="text-xs text-surface-500">Credit Limit</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-surface-800">{selectedClient._count?.shipments ?? 0}</p>
                <p className="text-xs text-surface-500">Shipments</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ClientsPage;
