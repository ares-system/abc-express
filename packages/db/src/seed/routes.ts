// ============================================
// ABC Express AIP — Mock Data: Routes
// Inter-branch route network
// ============================================

export interface RouteSeed {
  code: string;
  originCode: string;
  destCode: string;
  mode: 'ROAD' | 'SEA' | 'AIR' | 'MULTIMODAL';
  distanceKm: number;
  estimatedHours: number;
  baseCostPerKg: number;
}

export const routeSeeds: RouteSeed[] = [
  // ---- JAWA ROAD NETWORK (backbone) ----
  { code: 'RT-JKT-BDG-R', originCode: 'JKT-HUB', destCode: 'BDG-BRC', mode: 'ROAD', distanceKm: 150, estimatedHours: 4, baseCostPerKg: 2500 },
  { code: 'RT-JKT-SMG-R', originCode: 'JKT-HUB', destCode: 'SMG-HUB', mode: 'ROAD', distanceKm: 450, estimatedHours: 10, baseCostPerKg: 3500 },
  { code: 'RT-JKT-SBY-R', originCode: 'JKT-HUB', destCode: 'SBY-HUB', mode: 'ROAD', distanceKm: 780, estimatedHours: 16, baseCostPerKg: 4500 },
  { code: 'RT-JKT-CRB-R', originCode: 'JKT-HUB', destCode: 'CRB-BRC', mode: 'ROAD', distanceKm: 260, estimatedHours: 5, baseCostPerKg: 3000 },
  { code: 'RT-JKT-BKS-R', originCode: 'JKT-HUB', destCode: 'BKS-BRC', mode: 'ROAD', distanceKm: 25, estimatedHours: 1, baseCostPerKg: 2000 },
  { code: 'RT-JKT-TGR-R', originCode: 'JKT-HUB', destCode: 'TGR-WHS', mode: 'ROAD', distanceKm: 30, estimatedHours: 1, baseCostPerKg: 1500 },
  { code: 'RT-SMG-YOG-R', originCode: 'SMG-HUB', destCode: 'YOG-BRC', mode: 'ROAD', distanceKm: 120, estimatedHours: 3, baseCostPerKg: 2500 },
  { code: 'RT-SMG-SLO-R', originCode: 'SMG-HUB', destCode: 'SLO-BRC', mode: 'ROAD', distanceKm: 100, estimatedHours: 2.5, baseCostPerKg: 2500 },
  { code: 'RT-SBY-MLG-R', originCode: 'SBY-HUB', destCode: 'MLG-BRC', mode: 'ROAD', distanceKm: 90, estimatedHours: 2, baseCostPerKg: 2000 },
  { code: 'RT-BDG-CRB-R', originCode: 'BDG-BRC', destCode: 'CRB-BRC', mode: 'ROAD', distanceKm: 130, estimatedHours: 3, baseCostPerKg: 2500 },
  { code: 'RT-SLO-SBY-R', originCode: 'SLO-BRC', destCode: 'SBY-HUB', mode: 'ROAD', distanceKm: 260, estimatedHours: 5, baseCostPerKg: 3000 },

  // ---- SUMATRA ROAD NETWORK ----
  { code: 'RT-MDN-PKB-R', originCode: 'MDN-HUB', destCode: 'PKB-BRC', mode: 'ROAD', distanceKm: 530, estimatedHours: 12, baseCostPerKg: 4000 },
  { code: 'RT-MDN-PDG-R', originCode: 'MDN-HUB', destCode: 'PDG-BRC', mode: 'ROAD', distanceKm: 600, estimatedHours: 14, baseCostPerKg: 4500 },
  { code: 'RT-PKB-JMB-R', originCode: 'PKB-BRC', destCode: 'JMB-BRC', mode: 'ROAD', distanceKm: 480, estimatedHours: 10, baseCostPerKg: 3800 },
  { code: 'RT-JMB-PLB-R', originCode: 'JMB-BRC', destCode: 'PLB-BRC', mode: 'ROAD', distanceKm: 350, estimatedHours: 7, baseCostPerKg: 3500 },
  { code: 'RT-PLB-BDL-R', originCode: 'PLB-BRC', destCode: 'BDL-BRC', mode: 'ROAD', distanceKm: 450, estimatedHours: 9, baseCostPerKg: 3800 },
  { code: 'RT-BDL-JKT-R', originCode: 'BDL-BRC', destCode: 'JKT-HUB', mode: 'ROAD', distanceKm: 250, estimatedHours: 6, baseCostPerKg: 3200 },

  // ---- KALIMANTAN ROAD NETWORK ----
  { code: 'RT-BPN-SMD-R', originCode: 'BPN-HUB', destCode: 'SMD-BRC', mode: 'ROAD', distanceKm: 120, estimatedHours: 3, baseCostPerKg: 3000 },
  { code: 'RT-BJM-BPN-R', originCode: 'BJM-BRC', destCode: 'BPN-HUB', mode: 'ROAD', distanceKm: 400, estimatedHours: 9, baseCostPerKg: 4000 },
  { code: 'RT-BJM-PLK-R', originCode: 'BJM-BRC', destCode: 'PLK-BRC', mode: 'ROAD', distanceKm: 380, estimatedHours: 8, baseCostPerKg: 4200 },
  { code: 'RT-PTK-PLK-R', originCode: 'PTK-BRC', destCode: 'PLK-BRC', mode: 'ROAD', distanceKm: 700, estimatedHours: 16, baseCostPerKg: 5000 },

  // ---- SULAWESI ----
  { code: 'RT-MKS-PLU-R', originCode: 'MKS-HUB', destCode: 'PLU-BRC', mode: 'ROAD', distanceKm: 800, estimatedHours: 18, baseCostPerKg: 5500 },
  { code: 'RT-MKS-KDR-R', originCode: 'MKS-HUB', destCode: 'KDR-BRC', mode: 'ROAD', distanceKm: 500, estimatedHours: 12, baseCostPerKg: 4500 },

  // ---- SEA ROUTES (inter-island) ----
  { code: 'RT-JKT-MDN-S', originCode: 'TJP-PRT', destCode: 'BLT-PRT', mode: 'SEA', distanceKm: 1800, estimatedHours: 72, baseCostPerKg: 3000 },
  { code: 'RT-JKT-BPN-S', originCode: 'TJP-PRT', destCode: 'BPN-HUB', mode: 'SEA', distanceKm: 1400, estimatedHours: 60, baseCostPerKg: 3200 },
  { code: 'RT-JKT-MKS-S', originCode: 'TJP-PRT', destCode: 'MKS-PRT', mode: 'SEA', distanceKm: 1600, estimatedHours: 64, baseCostPerKg: 3500 },
  { code: 'RT-SBY-BPN-S', originCode: 'TPS-PRT', destCode: 'BPN-HUB', mode: 'SEA', distanceKm: 700, estimatedHours: 36, baseCostPerKg: 2800 },
  { code: 'RT-SBY-MKS-S', originCode: 'TPS-PRT', destCode: 'MKS-PRT', mode: 'SEA', distanceKm: 900, estimatedHours: 40, baseCostPerKg: 3000 },
  { code: 'RT-SBY-DPS-S', originCode: 'TPS-PRT', destCode: 'DPS-BRC', mode: 'SEA', distanceKm: 350, estimatedHours: 14, baseCostPerKg: 2500 },
  { code: 'RT-MKS-AMB-S', originCode: 'MKS-PRT', destCode: 'AMB-BRC', mode: 'SEA', distanceKm: 1200, estimatedHours: 48, baseCostPerKg: 4000 },
  { code: 'RT-MKS-JYP-S', originCode: 'MKS-PRT', destCode: 'JYP-BRC', mode: 'SEA', distanceKm: 2800, estimatedHours: 96, baseCostPerKg: 5000 },
  { code: 'RT-SBY-KPG-S', originCode: 'TPS-PRT', destCode: 'KPG-BRC', mode: 'SEA', distanceKm: 1500, estimatedHours: 60, baseCostPerKg: 4500 },
  { code: 'RT-SBY-BJM-S', originCode: 'TPS-PRT', destCode: 'BJM-BRC', mode: 'SEA', distanceKm: 500, estimatedHours: 24, baseCostPerKg: 2600 },
  { code: 'RT-JKT-PTK-S', originCode: 'TJP-PRT', destCode: 'PTK-BRC', mode: 'SEA', distanceKm: 900, estimatedHours: 40, baseCostPerKg: 3200 },
  { code: 'RT-JKT-BTM-S', originCode: 'TJP-PRT', destCode: 'BTM-BRC', mode: 'SEA', distanceKm: 1100, estimatedHours: 44, baseCostPerKg: 3000 },
  { code: 'RT-MKS-SRG-S', originCode: 'MKS-PRT', destCode: 'SRG-BRC', mode: 'SEA', distanceKm: 2000, estimatedHours: 72, baseCostPerKg: 4800 },
  { code: 'RT-JYP-TIM-S', originCode: 'JYP-BRC', destCode: 'TIM-BRC', mode: 'SEA', distanceKm: 600, estimatedHours: 28, baseCostPerKg: 5500 },

  // ---- AIR ROUTES (premium/express) ----
  { code: 'RT-JKT-SBY-A', originCode: 'JKT-HUB', destCode: 'SBY-HUB', mode: 'AIR', distanceKm: 690, estimatedHours: 1.5, baseCostPerKg: 15000 },
  { code: 'RT-JKT-MDN-A', originCode: 'JKT-HUB', destCode: 'MDN-HUB', mode: 'AIR', distanceKm: 1750, estimatedHours: 2.5, baseCostPerKg: 18000 },
  { code: 'RT-JKT-MKS-A', originCode: 'JKT-HUB', destCode: 'MKS-HUB', mode: 'AIR', distanceKm: 1400, estimatedHours: 2.5, baseCostPerKg: 17000 },
  { code: 'RT-JKT-BPN-A', originCode: 'JKT-HUB', destCode: 'BPN-HUB', mode: 'AIR', distanceKm: 1300, estimatedHours: 2, baseCostPerKg: 16000 },
  { code: 'RT-JKT-JYP-A', originCode: 'JKT-HUB', destCode: 'JYP-BRC', mode: 'AIR', distanceKm: 3400, estimatedHours: 5, baseCostPerKg: 25000 },
  { code: 'RT-JKT-DPS-A', originCode: 'JKT-HUB', destCode: 'DPS-BRC', mode: 'AIR', distanceKm: 1000, estimatedHours: 1.5, baseCostPerKg: 14000 },
  { code: 'RT-SBY-MKS-A', originCode: 'SBY-HUB', destCode: 'MKS-HUB', mode: 'AIR', distanceKm: 750, estimatedHours: 1.5, baseCostPerKg: 14000 },
  { code: 'RT-SBY-BPN-A', originCode: 'SBY-HUB', destCode: 'BPN-HUB', mode: 'AIR', distanceKm: 600, estimatedHours: 1, baseCostPerKg: 13000 },
  { code: 'RT-MKS-JYP-A', originCode: 'MKS-HUB', destCode: 'JYP-BRC', mode: 'AIR', distanceKm: 2100, estimatedHours: 3, baseCostPerKg: 22000 },
  { code: 'RT-MKS-MND-A', originCode: 'MKS-HUB', destCode: 'MND-BRC', mode: 'AIR', distanceKm: 1600, estimatedHours: 2, baseCostPerKg: 16000 },
];
