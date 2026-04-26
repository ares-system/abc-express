// ============================================
// ABC Express AIP — Shared Constants
// ============================================

// Indonesian provinces/regions for branch categorization
export const REGIONS = {
  SUMATRA: 'Sumatra',
  JAWA: 'Jawa',
  KALIMANTAN: 'Kalimantan',
  SULAWESI: 'Sulawesi',
  BALI_NUSRA: 'Bali & Nusa Tenggara',
  MALUKU_PAPUA: 'Maluku & Papua',
} as const;

export const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau',
  'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung', 'Bangka Belitung',
  'DKI Jakarta', 'Banten', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta',
  'Jawa Timur', 'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan',
  'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Gorontalo',
  'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Barat', 'Sulawesi Tenggara',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Maluku', 'Maluku Utara',
  'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan',
] as const;

// Connote number prefix
export const CONNOTE_PREFIX = 'ABC';

// Invoice number prefix
export const INVOICE_PREFIX = 'INV';

// Default pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Shipment weight limits by service type (kg)
export const WEIGHT_LIMITS = {
  CARGO: { min: 1, max: 30000 },
  PROJECT_CARGO: { min: 100, max: 500000 },
  VEHICLE_HEAVY_EQUIPMENT: { min: 500, max: 200000 },
  EXPORT: { min: 1, max: 50000 },
  IMPORT: { min: 1, max: 50000 },
} as const;

// Status transitions — which statuses can transition to which
export const SHIPMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['BOOKED', 'CANCELLED'],
  BOOKED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'AT_HUB', 'EXCEPTION'],
  IN_TRANSIT: ['AT_HUB', 'OUT_FOR_DELIVERY', 'EXCEPTION', 'ON_HOLD'],
  AT_HUB: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'EXCEPTION', 'ON_HOLD'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'EXCEPTION', 'RETURNED'],
  ON_HOLD: ['IN_TRANSIT', 'AT_HUB', 'CANCELLED', 'EXCEPTION'],
  EXCEPTION: ['IN_TRANSIT', 'AT_HUB', 'ON_HOLD', 'RETURNED', 'CANCELLED'],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
};
