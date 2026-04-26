'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { KpiCard, Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoading, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import {
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  formatPercent,
  formatWeight,
  formatRelative,
  getShipmentStatus,
  getTrackingEvent,
  capitalize,
  cn,
} from '@/lib/utils';
import {
  Package,
  Truck,
  CheckCircle2,
  Brain,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────

interface OpsKpi {
  totalShipments: number;
  shipmentsToday: number;
  shipmentsThisMonth: number;
  inTransit: number;
  delivered: number;
  deliveryRate: number;
  activeVehicles: number;
  pendingDecisions: number;
}

interface StatusCount {
  status: string;
  _count: { id: number };
}

interface ServiceTypeGroup {
  serviceType: string;
  _count: { id: number };
  _sum: { totalChargeAmount: number | null; weightKg: number | null };
}

interface VehicleStatusGroup {
  status: string;
  _count: { id: number };
}

interface RecentEvent {
  id: string;
  status: string;
  location: string;
  notes: string | null;
  timestamp: string;
  shipment: { connoteNumber: string; serviceType: string };
}

interface OpsData {
  kpi: OpsKpi;
  shipmentsByStatus: StatusCount[];
  shipmentsByServiceType: ServiceTypeGroup[];
  vehiclesByStatus: VehicleStatusGroup[];
  recentEvents: RecentEvent[];
}

interface FinanceKpi {
  totalRevenue: number;
  totalCosts: number;
  grossMargin: number;
  grossMarginPct: number;
  totalOutstanding: number;
  overdueCount: number;
  overdueAmount: number;
  revenueThisMonth: number;
  costsThisMonth: number;
}

interface InvoiceStatusGroup {
  status: string;
  _count: { id: number };
  _sum: { totalAmount: number | null; paidAmount: number | null };
}

interface CostCategoryGroup {
  category: string;
  _sum: { amount: number | null };
  _count: { id: number };
}

interface TopClient {
  clientId: string;
  _sum: { totalAmount: number | null };
  _count: { id: number };
  client: { id: string; code: string; name: string; companyName: string | null } | null;
}

interface FinanceData {
  kpi: FinanceKpi;
  invoicesByStatus: InvoiceStatusGroup[];
  costByCategory: CostCategoryGroup[];
  topClients: TopClient[];
}

// ─── Chart colors ───────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING_PICKUP: '#94a3b8',
  PICKED_UP: '#60a5fa',
  IN_WAREHOUSE: '#818cf8',
  IN_TRANSIT: '#f59e0b',
  AT_HUB: '#38bdf8',
  OUT_FOR_DELIVERY: '#fb923c',
  DELIVERED: '#22c55e',
  FAILED_DELIVERY: '#ef4444',
  RETURNED: '#f87171',
  CANCELLED: '#dc2626',
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  SENT: '#3b82f6',
  PARTIAL: '#f59e0b',
  PAID: '#22c55e',
  OVERDUE: '#ef4444',
  CANCELLED: '#dc2626',
};

// ─── Custom Tooltip ─────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, isCurrency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-surface-600">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {isCurrency ? formatCompactCurrency(entry.value) : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Dashboard Page ─────────────────────────────────────────

const DashboardPage = () => {
  const { user, canAccess } = useAuth();
  const showFinance = canAccess(['ADMIN', 'FINANCE_MANAGER']);

  // Fetch operations data (30s refresh)
  const ops = useApi<OpsData>('/dashboard/operations', { refreshInterval: 30_000 });

  // Fetch finance data if authorized (60s refresh)
  const fin = useApi<FinanceData>('/dashboard/finance', {
    enabled: showFinance,
    refreshInterval: 60_000,
  });

  // Chart data transforms
  const shipmentStatusChart = useMemo(() => {
    if (!ops.data?.shipmentsByStatus) return [];
    return ops.data.shipmentsByStatus
      .map((s) => ({
        name: getShipmentStatus(s.status).label,
        value: s._count.id,
        fill: STATUS_COLORS[s.status] ?? '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value);
  }, [ops.data]);

  const serviceTypeChart = useMemo(() => {
    if (!ops.data?.shipmentsByServiceType) return [];
    return ops.data.shipmentsByServiceType.map((s) => ({
      name: s.serviceType.replace(/_/g, ' '),
      shipments: s._count.id,
      revenue: s._sum.totalChargeAmount ?? 0,
      weight: s._sum.weightKg ?? 0,
    }));
  }, [ops.data]);

  const vehicleStatusChart = useMemo(() => {
    if (!ops.data?.vehiclesByStatus) return [];
    return ops.data.vehiclesByStatus.map((v) => ({
      name: capitalize(v.status.replace(/_/g, ' ')),
      value: v._count.id,
    }));
  }, [ops.data]);

  const costCategoryChart = useMemo(() => {
    if (!fin.data?.costByCategory) return [];
    return fin.data.costByCategory.map((c) => ({
      name: capitalize(c.category.replace(/_/g, ' ')),
      amount: c._sum.amount ?? 0,
      count: c._count.id,
    }));
  }, [fin.data]);

  const invoiceStatusChart = useMemo(() => {
    if (!fin.data?.invoicesByStatus) return [];
    return fin.data.invoicesByStatus.map((s) => ({
      name: capitalize(s.status),
      value: s._count.id,
      amount: s._sum.totalAmount ?? 0,
      fill: INVOICE_STATUS_COLORS[s.status] ?? '#94a3b8',
    }));
  }, [fin.data]);

  const handleRefresh = () => {
    ops.refetch();
    if (showFinance) fin.refetch();
  };

  // Initial loading
  if (ops.isLoading && !ops.data) {
    return (
      <>
        <Header title="Dashboard" subtitle="Loading overview..." />
        <div className="p-6">
          <PageLoading message="Loading dashboard data..." />
        </div>
      </>
    );
  }

  if (ops.error && !ops.data) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="p-6">
          <ErrorState message={ops.error} onRetry={ops.refetch} />
        </div>
      </>
    );
  }

  const kpi = ops.data!.kpi;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name?.split(' ')[0] ?? 'User'}`}
        actions={
          <Button variant="ghost" size="sm" onClick={handleRefresh} aria-label="Refresh data">
            <RefreshCw className={cn('h-4 w-4', ops.isLoading && 'animate-spin')} />
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {/* ── Operations KPIs ──────────────────────────────── */}
        <section aria-label="Operations KPIs">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">
            Operations Overview
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Shipments"
              value={formatNumber(kpi.totalShipments)}
              subtitle={`${formatNumber(kpi.shipmentsToday)} today`}
              icon={<Package className="h-5 w-5" />}
              trend={{ value: 12, label: 'vs last month' }}
            />
            <KpiCard
              title="In Transit"
              value={formatNumber(kpi.inTransit)}
              subtitle={`${formatNumber(kpi.shipmentsThisMonth)} this month`}
              icon={<Truck className="h-5 w-5" />}
            />
            <KpiCard
              title="Delivery Rate"
              value={formatPercent(kpi.deliveryRate * 100)}
              subtitle={`${formatNumber(kpi.delivered)} delivered`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              trend={{ value: kpi.deliveryRate >= 0.8 ? 2.1 : -1.5, label: 'vs last month' }}
            />
            <KpiCard
              title="Pending AI Decisions"
              value={formatNumber(kpi.pendingDecisions)}
              subtitle="Awaiting human review"
              icon={<Brain className="h-5 w-5" />}
              className={kpi.pendingDecisions > 5 ? 'ring-2 ring-amber-200' : ''}
            />
          </div>
        </section>

        {/* ── Finance KPIs (role-gated) ───────────────────── */}
        {showFinance && fin.data && (
          <section aria-label="Finance KPIs">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-surface-400">
              Financial Overview
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Total Revenue"
                value={formatCompactCurrency(fin.data.kpi.totalRevenue)}
                subtitle={`${formatCompactCurrency(fin.data.kpi.revenueThisMonth)} this month`}
                icon={<DollarSign className="h-5 w-5" />}
                trend={{ value: 8.3, label: 'vs last month' }}
              />
              <KpiCard
                title="Gross Margin"
                value={formatPercent(fin.data.kpi.grossMarginPct * 100)}
                subtitle={formatCompactCurrency(fin.data.kpi.grossMargin)}
                icon={<TrendingUp className="h-5 w-5" />}
                trend={{ value: fin.data.kpi.grossMarginPct >= 0.2 ? 1.2 : -0.8, label: 'vs last month' }}
              />
              <KpiCard
                title="Outstanding"
                value={formatCompactCurrency(fin.data.kpi.totalOutstanding)}
                subtitle={`${formatCompactCurrency(fin.data.kpi.costsThisMonth)} costs this month`}
                icon={<CreditCard className="h-5 w-5" />}
              />
              <KpiCard
                title="Overdue"
                value={formatNumber(fin.data.kpi.overdueCount)}
                subtitle={formatCompactCurrency(fin.data.kpi.overdueAmount)}
                icon={<AlertTriangle className="h-5 w-5" />}
                className={fin.data.kpi.overdueCount > 0 ? 'ring-2 ring-red-200' : ''}
              />
            </div>
          </section>
        )}

        {/* ── Charts Row 1: Shipment Status + Service Type ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Shipments by Status */}
          <Card padding="lg">
            <CardHeader
              title="Shipments by Status"
              subtitle={`${formatNumber(kpi.totalShipments)} total`}
            />
            <div className="mt-4 h-72">
              {shipmentStatusChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shipmentStatusChart} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={110}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                      {shipmentStatusChart.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-surface-400">
                  No data available
                </div>
              )}
            </div>
          </Card>

          {/* Shipments by Service Type */}
          <Card padding="lg">
            <CardHeader
              title="Revenue by Service Type"
              subtitle="Shipment volume and revenue"
            />
            <div className="mt-4 h-72">
              {serviceTypeChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceTypeChart} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 shadow-lg">
                            <p className="text-xs font-medium text-surface-600">{label}</p>
                            <p className="text-sm text-blue-600">
                              {formatNumber(d.shipments)} shipments
                            </p>
                            <p className="text-sm text-green-600">
                              {formatCompactCurrency(d.revenue)}
                            </p>
                            <p className="text-sm text-surface-500">
                              {formatWeight(d.weight)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="shipments" fill="#3b82f6" name="Shipments" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-surface-400">
                  No data available
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Charts Row 2: Vehicles + Finance (conditional) ─ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Vehicle Status Pie */}
          <Card padding="lg">
            <CardHeader
              title="Fleet Status"
              subtitle={`${formatNumber(kpi.activeVehicles)} active vehicles`}
            />
            <div className="mt-4 h-64">
              {vehicleStatusChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleStatusChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {vehicleStatusChart.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-surface-400">
                  No data available
                </div>
              )}
            </div>
          </Card>

          {/* Finance: Cost Breakdown or Invoice Status */}
          {showFinance && fin.data ? (
            <Card padding="lg">
              <CardHeader
                title="Cost Breakdown"
                subtitle="By category"
              />
              <div className="mt-4 h-64">
                {costCategoryChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costCategoryChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<ChartTooltip isCurrency />} />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-surface-400">
                    No data available
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* Non-finance users: show a service type distribution pie instead */
            <Card padding="lg">
              <CardHeader
                title="Service Distribution"
                subtitle="By shipment volume"
              />
              <div className="mt-4 h-64">
                {serviceTypeChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceTypeChart}
                        dataKey="shipments"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={2}
                        label={({ name, shipments }) => `${name}: ${shipments}`}
                      >
                        {serviceTypeChart.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-surface-400">
                    No data available
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ── Finance Row 3: Invoice Status + Top Clients ──── */}
        {showFinance && fin.data && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Invoice Status */}
            <Card padding="lg">
              <CardHeader title="Invoices by Status" />
              <div className="mt-4 h-64">
                {invoiceStatusChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoiceStatusChart}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={2}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {invoiceStatusChart.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, entry: any) => [
                          `${formatNumber(value)} invoices (${formatCompactCurrency(entry.payload.amount)})`,
                          name,
                        ]}
                      />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-surface-400">
                    No data available
                  </div>
                )}
              </div>
            </Card>

            {/* Top Clients Table */}
            <Card padding="lg">
              <CardHeader title="Top Clients by Revenue" subtitle="Top 10" />
              <div className="mt-4 overflow-y-auto" style={{ maxHeight: 256 }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 text-left text-xs font-medium uppercase text-surface-400">
                      <th className="pb-2 pr-3">#</th>
                      <th className="pb-2 pr-3">Client</th>
                      <th className="pb-2 pr-3 text-right">Invoices</th>
                      <th className="pb-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fin.data.topClients.map((c, i) => (
                      <tr key={c.clientId} className="border-b border-surface-50 last:border-0">
                        <td className="py-2 pr-3 text-surface-400">{i + 1}</td>
                        <td className="py-2 pr-3">
                          <p className="font-medium text-surface-800 truncate max-w-[160px]">
                            {c.client?.companyName ?? c.client?.name ?? 'Unknown'}
                          </p>
                          {c.client?.code && (
                            <p className="text-xs text-surface-400">{c.client.code}</p>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right text-surface-600">
                          {formatNumber(c._count.id)}
                        </td>
                        <td className="py-2 text-right font-medium text-surface-800">
                          {formatCompactCurrency(c._sum.totalAmount ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Recent Activity Feed ────────────────────────── */}
        <Card padding="lg">
          <CardHeader
            title="Recent Activity"
            subtitle="Latest tracking events"
            action={
              <Badge variant="info" dot>
                <Activity className="mr-1 inline h-3 w-3" />
                Live
              </Badge>
            }
          />
          <div className="mt-4 divide-y divide-surface-100">
            {ops.data?.recentEvents && ops.data.recentEvents.length > 0 ? (
              ops.data.recentEvents.map((event) => {
                const st = getTrackingEvent(event.status);
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    {/* Status dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          st.variant === 'success' && 'bg-green-500',
                          st.variant === 'warning' && 'bg-amber-500',
                          st.variant === 'danger' && 'bg-red-500',
                          st.variant === 'info' && 'bg-blue-500',
                          st.variant === 'neutral' && 'bg-surface-400',
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-surface-800">
                          {event.shipment.connoteNumber}
                        </span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-surface-500">
                        {event.location}
                        {event.notes && ` — ${event.notes}`}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="flex-shrink-0 text-xs text-surface-400">
                      {formatRelative(event.timestamp)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-surface-400">
                No recent activity
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

export default DashboardPage;
