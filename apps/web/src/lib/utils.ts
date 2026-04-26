// ============================================
// ABC Express AIP — Utility functions
// ============================================

import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

// ─── Class names ────────────────────────────────────────────

export const cn = (...inputs: ClassValue[]): string => clsx(inputs);

// ─── Date formatting ────────────────────────────────────────

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy HH:mm');
};

export const formatRelative = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

// ─── Currency ───────────────────────────────────────────────

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatCompactCurrency = (amount: number): string => {
  if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)}K`;
  return formatCurrency(amount);
};

// ─── Numbers ────────────────────────────────────────────────

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('id-ID').format(n);

export const formatPercent = (n: number, decimals = 1): string =>
  `${n.toFixed(decimals)}%`;

export const formatWeight = (kg: number): string => {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} ton`;
  return `${kg.toFixed(1)} kg`;
};

// ─── Status helpers ─────────────────────────────────────────

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const SHIPMENT_STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  PENDING_PICKUP: { label: 'Pending Pickup', variant: 'neutral' },
  PICKED_UP: { label: 'Picked Up', variant: 'info' },
  IN_WAREHOUSE: { label: 'In Warehouse', variant: 'info' },
  IN_TRANSIT: { label: 'In Transit', variant: 'warning' },
  AT_HUB: { label: 'At Hub', variant: 'info' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'warning' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  FAILED_DELIVERY: { label: 'Failed Delivery', variant: 'danger' },
  RETURNED: { label: 'Returned', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
};

export const getShipmentStatus = (status: string) =>
  SHIPMENT_STATUS_MAP[status] ?? { label: status, variant: 'neutral' as StatusVariant };

const INVOICE_STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  SENT: { label: 'Sent', variant: 'info' },
  PARTIAL: { label: 'Partial', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
};

/** ShipmentEvent.type — for activity feed (not the same as ShipmentStatus). */
const TRACKING_EVENT_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  CREATED: { label: 'Created', variant: 'info' },
  PICKED_UP: { label: 'Picked up', variant: 'info' },
  ARRIVED_AT_HUB: { label: 'Arrived at hub', variant: 'info' },
  DEPARTED_HUB: { label: 'Departed hub', variant: 'warning' },
  IN_TRANSIT: { label: 'In transit', variant: 'warning' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', variant: 'warning' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  EXCEPTION: { label: 'Exception', variant: 'danger' },
  ON_HOLD: { label: 'On hold', variant: 'warning' },
  RETURNED: { label: 'Returned', variant: 'danger' },
  NOTE_ADDED: { label: 'Note', variant: 'neutral' },
};

export const getTrackingEvent = (type: string) =>
  TRACKING_EVENT_MAP[type] ?? {
    label: type.replace(/_/g, ' '),
    variant: 'neutral' as StatusVariant,
  };

export const getInvoiceStatus = (status: string) =>
  INVOICE_STATUS_MAP[status] ?? { label: status, variant: 'neutral' as StatusVariant };

const VEHICLE_STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  AVAILABLE: { label: 'Available', variant: 'success' },
  IN_TRANSIT: { label: 'In Transit', variant: 'warning' },
  MAINTENANCE: { label: 'Maintenance', variant: 'danger' },
  RETIRED: { label: 'Retired', variant: 'neutral' },
};

export const getVehicleStatus = (status: string) =>
  VEHICLE_STATUS_MAP[status] ?? { label: status, variant: 'neutral' as StatusVariant };

const DECISION_STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  AI_RECOMMENDED: { label: 'AI Recommended', variant: 'info' },
  HUMAN_APPROVED: { label: 'Approved', variant: 'success' },
  HUMAN_OVERRIDDEN: { label: 'Overridden', variant: 'warning' },
  HUMAN_REJECTED: { label: 'Rejected', variant: 'danger' },
  AUTO_APPLIED: { label: 'Auto Applied', variant: 'success' },
};

export const getDecisionStatus = (status: string) =>
  DECISION_STATUS_MAP[status] ?? { label: status, variant: 'neutral' as StatusVariant };

// ─── Variant to Tailwind class ──────────────────────────────

export const variantClasses: Record<StatusVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-surface-100 text-surface-600 border-surface-200',
};

export const variantDotClasses: Record<StatusVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-surface-400',
};

// ─── Misc ───────────────────────────────────────────────────

export const truncate = (str: string, len: number): string =>
  str.length > len ? `${str.slice(0, len)}...` : str;

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
