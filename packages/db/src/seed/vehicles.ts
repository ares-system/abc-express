// ============================================
// ABC Express AIP — Mock Data: Vehicles
// Fleet of trucks, trailers, containers
// ============================================

export interface VehicleSeed {
  plateNumber: string;
  type: 'TRUCK_SMALL' | 'TRUCK_MEDIUM' | 'TRUCK_LARGE' | 'TRAILER' | 'CONTAINER' | 'SHIP' | 'PLANE';
  brand: string;
  model: string;
  year: number;
  capacityKg: number;
  capacityM3: number;
  status: 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'LOADING' | 'UNLOADING' | 'OUT_OF_SERVICE';
  branchCode: string; // will be resolved to branchId during seeding
  driverName: string;
  driverPhone: string;
}

const truckBrands = [
  { brand: 'Hino', models: ['Dutro 130', 'Ranger FL 235', 'FM 260 JD'] },
  { brand: 'Mitsubishi Fuso', models: ['Canter FE 71', 'Fighter FM 65', 'Super Great FV 51'] },
  { brand: 'Isuzu', models: ['Elf NMR 71', 'Giga FVZ 34', 'EXZ 77'] },
  { brand: 'Toyota', models: ['Dyna 110', 'Dyna 130'] },
  { brand: 'UD Trucks', models: ['Kuzer RKE 150', 'Quester GKE 280'] },
];

const driverFirstNames = ['Bambang', 'Suparman', 'Dedi', 'Heri', 'Joko', 'Andi', 'Rudi', 'Yanto', 'Supri', 'Darto', 'Wawan', 'Sugeng', 'Parman', 'Kamal', 'Ridwan', 'Udin', 'Surya', 'Tono', 'Bowo', 'Imam'];

const statuses: VehicleSeed['status'][] = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'IN_TRANSIT', 'IN_TRANSIT', 'MAINTENANCE', 'LOADING'];

const branchCodes = ['JKT-HUB', 'SBY-HUB', 'SMG-HUB', 'MDN-HUB', 'BPN-HUB', 'MKS-HUB', 'BDG-BRC', 'PLB-BRC', 'BJM-BRC', 'DPS-BRC', 'YOG-BRC', 'SLO-BRC', 'PKB-BRC', 'PTK-BRC', 'TGR-WHS'];

export const vehicleSeeds: VehicleSeed[] = [];

// Generate 80 vehicles across the fleet
for (let i = 0; i < 80; i++) {
  const brandInfo = truckBrands[i % truckBrands.length]!;
  const model = brandInfo.models[i % brandInfo.models.length]!;
  const driverName = `${driverFirstNames[i % driverFirstNames.length]} ${['Santoso', 'Wibowo', 'Hidayat', 'Kurniawan', 'Setiawan'][i % 5]}`;

  let type: VehicleSeed['type'];
  let capacityKg: number;
  let capacityM3: number;

  if (i < 25) {
    type = 'TRUCK_SMALL';
    capacityKg = 3000 + (i % 5) * 500;
    capacityM3 = 12 + (i % 3) * 2;
  } else if (i < 50) {
    type = 'TRUCK_MEDIUM';
    capacityKg = 8000 + (i % 5) * 1000;
    capacityM3 = 25 + (i % 4) * 5;
  } else if (i < 65) {
    type = 'TRUCK_LARGE';
    capacityKg = 20000 + (i % 5) * 2000;
    capacityM3 = 50 + (i % 3) * 10;
  } else if (i < 75) {
    type = 'TRAILER';
    capacityKg = 30000 + (i % 4) * 5000;
    capacityM3 = 60 + (i % 3) * 10;
  } else {
    type = 'CONTAINER';
    capacityKg = 25000;
    capacityM3 = 33; // 20ft container
  }

  const region = ['B', 'L', 'H', 'BK', 'KT', 'DD', 'D', 'BG', 'DA', 'DK'][i % 10]!;
  const num = String(1000 + i * 37).slice(0, 4);
  const suffix = ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST'][i % 10]!;

  vehicleSeeds.push({
    plateNumber: `${region} ${num} ${suffix}`,
    type,
    brand: brandInfo.brand,
    model,
    year: 2019 + (i % 6),
    capacityKg,
    capacityM3,
    status: statuses[i % statuses.length]!,
    branchCode: branchCodes[i % branchCodes.length]!,
    driverName,
    driverPhone: `08${String(2200000000 + i * 1234567).slice(0, 10)}`,
  });
}
