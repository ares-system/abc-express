// ============================================
// ABC Express AIP — Main Seed Script
// Populates database with realistic mock data
// ============================================
// Resolves .env from monorepo root first (`pnpm db:seed` from repo root),
// then `packages/db/.env`, then `process.cwd()/.env`.

import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { config } from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { branchSeeds } from './branches.js';
import { clientSeeds } from './clients.js';
import { vehicleSeeds } from './vehicles.js';
import { routeSeeds } from './routes.js';

const envCandidates = [
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];
let envLoaded = false;
for (const p of envCandidates) {
  if (existsSync(p)) {
    config({ path: p });
    console.log(`📄 Loaded .env: ${p}`);
    envLoaded = true;
    break;
  }
}
if (!envLoaded) {
  config();
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://abc_user:abc_pass@localhost:5432/abc_express?schema=public',
    },
  },
});

// ---- Helpers ----

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals = 2): number =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const generateConnoteNumber = (index: number): string => {
  const year = '2025';
  const month = String(randomBetween(1, 12)).padStart(2, '0');
  const seq = String(index).padStart(7, '0');
  return `ABC${year}${month}${seq}`;
};

const generateInvoiceNumber = (index: number): string => {
  const year = '2025';
  const month = String(randomBetween(1, 12)).padStart(2, '0');
  const seq = String(index).padStart(6, '0');
  return `INV-${year}${month}-${seq}`;
};

const serviceTypes = ['CARGO', 'CARGO', 'CARGO', 'PROJECT_CARGO', 'VEHICLE_HEAVY_EQUIPMENT', 'EXPORT', 'IMPORT'] as const;
const shipmentStatuses = ['DRAFT', 'BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'IN_TRANSIT', 'AT_HUB', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED'] as const;
const costCategories = ['FUEL', 'LABOR', 'TOLL', 'VEHICLE_MAINTENANCE', 'INSURANCE', 'PACKAGING', 'STORAGE', 'OVERHEAD'] as const;

const itemDescriptions: Record<string, string[]> = {
  CARGO: ['Spare parts elektronik', 'Bahan bangunan', 'Peralatan kantor', 'Pakaian & tekstil', 'Makanan kemasan', 'Produk plastik', 'Bahan kimia non-hazard', 'Perabot rumah tangga', 'Mesin industri kecil', 'Suku cadang otomotif'],
  PROJECT_CARGO: ['Komponen tower telekomunikasi', 'Panel surya 500kW', 'Generator set industri', 'Struktur baja jembatan', 'Transformator listrik 150kV', 'Mesin pabrik tekstil'],
  VEHICLE_HEAVY_EQUIPMENT: ['Excavator CAT 320D', 'Dump Truck HD785', 'Toyota Avanza 2024', 'Forklift Komatsu 3 Ton', 'Crane Mobile 50 Ton', 'Honda CRV 2024'],
  EXPORT: ['Crude Palm Oil (CPO)', 'Kopi Arabika Toraja', 'Furnitur kayu jati', 'Produk kerajinan Bali', 'Rempah-rempah organik', 'Karet alam RSS1'],
  IMPORT: ['Mesin CNC dari Jerman', 'Komponen elektronik Taiwan', 'Bahan baku farmasi India', 'Tekstil dari China', 'Alat medis dari Jepang', 'Peralatan tambang Australia'],
};

const senderNames = ['Budi Hartono', 'Siti Rahayu', 'Ahmad Fauzi', 'Dewi Lestari', 'Eko Prasetyo', 'Rina Marlina', 'Hendra Gunawan', 'Lina Susanti', 'Agus Setiawan', 'Maya Putri'];
const receiverNames = ['Dani Wibowo', 'Yuli Astuti', 'Arif Nugroho', 'Nisa Amalia', 'Wahyu Santoso', 'Fitri Handayani', 'Reza Firmansyah', 'Anita Permata', 'Irwan Hidayat', 'Sari Dewi'];

// ---- Main Seed Function ----

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data
  console.log('🗑️  Cleaning existing data...');
  await prisma.decision.deleteMany();
  await prisma.costEntry.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.route.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 1. Seed Branches
  console.log('🏢 Seeding branches...');
  const branches = await Promise.all(
    branchSeeds.map((b) =>
      prisma.branch.create({
        data: {
          code: b.code,
          name: b.name,
          city: b.city,
          province: b.province,
          region: b.region,
          type: b.type,
          address: b.address,
          phone: b.phone,
          latitude: b.latitude,
          longitude: b.longitude,
          capacity: b.capacity,
        },
      }),
    ),
  );
  console.log(`   ✓ ${branches.length} branches created`);

  const branchMap = new Map(branches.map((b) => [b.code, b.id]));

  // 2. Seed Users (admin + ops + finance + dispatchers)
  console.log('👤 Seeding users...');
  const bcryptModule = await import('bcryptjs');
  const hashFn = bcryptModule.hash || bcryptModule.default?.hash;
  const devRandom =
    process.env.SEED_DEV_RANDOM === '1' || process.env.SEED_DEV_RANDOM === 'true';
  const devTag = devRandom ? randomBytes(3).toString('hex') : null;
  const plainPassword = devRandom
    ? `Dev!${randomBytes(12).toString('base64url')}`
    : 'password123';
  const emailFor = (localPart: string) =>
    devTag ? `${localPart}.${devTag}@abcexpress.local` : `${localPart}@abcexpress.id`;
  const passwordHash = await hashFn(plainPassword, 10);

  const userSeeds: {
    localPart: string;
    name: string;
    role: 'ADMIN' | 'OPS_MANAGER' | 'FINANCE_MANAGER' | 'DISPATCHER' | 'BRANCH_STAFF' | 'VIEWER';
    branchCode: string | null;
  }[] = [
    { localPart: 'admin', name: 'Admin Utama', role: 'ADMIN', branchCode: 'JKT-HUB' },
    { localPart: 'ops.manager', name: 'Rizky Ops Manager', role: 'OPS_MANAGER', branchCode: 'JKT-HUB' },
    { localPart: 'finance', name: 'Diana Finance', role: 'FINANCE_MANAGER', branchCode: 'JKT-HUB' },
    { localPart: 'dispatcher.jkt', name: 'Bambang Dispatcher', role: 'DISPATCHER', branchCode: 'JKT-HUB' },
    { localPart: 'dispatcher.sby', name: 'Andi Dispatcher', role: 'DISPATCHER', branchCode: 'SBY-HUB' },
    { localPart: 'staff.smg', name: 'Sari Branch Staff', role: 'BRANCH_STAFF', branchCode: 'SMG-HUB' },
    { localPart: 'staff.mdn', name: 'Heri Branch Staff', role: 'BRANCH_STAFF', branchCode: 'MDN-HUB' },
    { localPart: 'viewer', name: 'Guest Viewer', role: 'VIEWER', branchCode: null },
  ];

  const users = await Promise.all(
    userSeeds.map((u) =>
      prisma.user.create({
        data: {
          email: emailFor(u.localPart),
          passwordHash,
          name: u.name,
          role: u.role,
          branchId: u.branchCode ? branchMap.get(u.branchCode)! : null,
        },
      }),
    ),
  );
  console.log(`   ✓ ${users.length} users created`);
  if (devTag) {
    console.log('   SEED_DEV_RANDOM: emails use .abcexpress.local; one shared random password (printed at end).');
  } else {
    console.log("   Default password for all users: password123");
  }

  // 3. Seed Clients
  console.log('🧑‍💼 Seeding clients...');
  const clients = await Promise.all(
    clientSeeds.map((c) =>
      prisma.client.create({
        data: {
          code: c.code,
          name: c.name,
          type: c.type,
          companyName: c.companyName,
          email: c.email,
          phone: c.phone,
          address: c.address,
          city: c.city,
          province: c.province,
          npwp: c.npwp,
          creditLimit: c.creditLimit,
        },
      }),
    ),
  );
  console.log(`   ✓ ${clients.length} clients created`);

  // 4. Seed Vehicles
  console.log('🚛 Seeding vehicles...');
  const vehicles = await Promise.all(
    vehicleSeeds.map((v) =>
      prisma.vehicle.create({
        data: {
          plateNumber: v.plateNumber,
          type: v.type,
          brand: v.brand,
          model: v.model,
          year: v.year,
          capacityKg: v.capacityKg,
          capacityM3: v.capacityM3,
          status: v.status,
          currentBranchId: branchMap.get(v.branchCode) ?? null,
          driverName: v.driverName,
          driverPhone: v.driverPhone,
          lastMaintenanceDate: new Date(2025, randomBetween(0, 3), randomBetween(1, 28)),
        },
      }),
    ),
  );
  console.log(`   ✓ ${vehicles.length} vehicles created`);

  // 5. Seed Routes
  console.log('🗺️  Seeding routes...');
  const routes = await Promise.all(
    routeSeeds.map((r) =>
      prisma.route.create({
        data: {
          code: r.code,
          originBranchId: branchMap.get(r.originCode)!,
          destinationBranchId: branchMap.get(r.destCode)!,
          mode: r.mode,
          distanceKm: r.distanceKm,
          estimatedHours: r.estimatedHours,
          baseCostPerKg: r.baseCostPerKg,
        },
      }),
    ),
  );
  console.log(`   ✓ ${routes.length} routes created`);

  // 6. Seed Shipments (1000+)
  console.log('📦 Seeding shipments...');
  const branchCodes = [...branchMap.keys()].filter(
    (c) => !c.endsWith('-PRT'), // exclude ports as origin/dest for direct shipments
  );
  const SHIPMENT_COUNT = 1200;
  const shipmentData = [];

  for (let i = 1; i <= SHIPMENT_COUNT; i++) {
    const serviceType = randomItem([...serviceTypes]);
    const status = randomItem([...shipmentStatuses]);
    const client = randomItem(clients);
    const originCode = randomItem(branchCodes);
    let destCode = randomItem(branchCodes);
    while (destCode === originCode) {
      destCode = randomItem(branchCodes);
    }
    const originId = branchMap.get(originCode)!;
    const destId = branchMap.get(destCode)!;

    const descriptions = itemDescriptions[serviceType] ?? itemDescriptions['CARGO']!;
    const description = randomItem(descriptions);

    let weightKg: number;
    switch (serviceType) {
      case 'PROJECT_CARGO': weightKg = randomFloat(500, 50000, 1); break;
      case 'VEHICLE_HEAVY_EQUIPMENT': weightKg = randomFloat(1000, 30000, 1); break;
      default: weightKg = randomFloat(1, 5000, 1); break;
    }

    const createdAt = new Date(2025, randomBetween(0, 3), randomBetween(1, 28), randomBetween(6, 22), randomBetween(0, 59));
    const estDelivery = new Date(createdAt);
    estDelivery.setDate(estDelivery.getDate() + randomBetween(1, 14));

    // Set currentBranch based on status
    let currentBranchId: string | null = null;
    if (['IN_TRANSIT', 'AT_HUB'].includes(status)) {
      currentBranchId = randomItem([originId, destId]);
    } else if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      currentBranchId = destId;
    } else {
      currentBranchId = originId;
    }

    shipmentData.push({
      connoteNumber: generateConnoteNumber(i),
      clientId: client.id,
      originBranchId: originId,
      destinationBranchId: destId,
      currentBranchId,
      serviceType,
      status,
      description,
      weightKg,
      volumeM3: randomFloat(0.01, weightKg / 200, 2),
      lengthCm: randomFloat(10, 300, 0),
      widthCm: randomFloat(10, 200, 0),
      heightCm: randomFloat(10, 200, 0),
      pieces: randomBetween(1, serviceType === 'PROJECT_CARGO' ? 50 : 10),
      declaredValue: weightKg * randomBetween(5000, 50000),
      isInsured: Math.random() > 0.6,
      senderName: randomItem(senderNames),
      senderPhone: `08${String(randomBetween(1000000000, 9999999999))}`,
      senderAddress: `Jl. ${randomItem(['Merdeka', 'Sudirman', 'Thamrin', 'Gatot Subroto', 'Ahmad Yani'])} No.${randomBetween(1, 200)}`,
      receiverName: randomItem(receiverNames),
      receiverPhone: `08${String(randomBetween(1000000000, 9999999999))}`,
      receiverAddress: `Jl. ${randomItem(['Diponegoro', 'Imam Bonjol', 'Kartini', 'Hayam Wuruk', 'Gajah Mada'])} No.${randomBetween(1, 200)}`,
      estimatedDeliveryDate: estDelivery,
      actualDeliveryDate: status === 'DELIVERED' ? new Date(estDelivery.getTime() + randomBetween(-2, 3) * 86400000) : null,
      createdAt,
    });
  }

  // Batch create shipments
  let shipmentCount = 0;
  for (const data of shipmentData) {
    await prisma.shipment.create({ data });
    shipmentCount++;
    if (shipmentCount % 200 === 0) {
      console.log(`   ... ${shipmentCount}/${SHIPMENT_COUNT} shipments`);
    }
  }
  console.log(`   ✓ ${shipmentCount} shipments created`);

  // 7. Seed Shipment Events (tracking history)
  console.log('📍 Seeding shipment events...');
  const allShipments = await prisma.shipment.findMany({ select: { id: true, status: true, originBranchId: true, destinationBranchId: true, createdAt: true } });
  let eventCount = 0;

  for (const shipment of allShipments) {
    const events: { type: string; branchId: string | null; description: string; timestamp: Date }[] = [];
    const baseTime = new Date(shipment.createdAt);

    events.push({ type: 'CREATED', branchId: shipment.originBranchId, description: 'Shipment created and booked', timestamp: new Date(baseTime) });

    const statusOrder = ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIdx = statusOrder.indexOf(shipment.status);

    if (currentIdx >= 1) {
      baseTime.setHours(baseTime.getHours() + randomBetween(1, 4));
      events.push({ type: 'PICKED_UP', branchId: shipment.originBranchId, description: 'Package picked up from sender', timestamp: new Date(baseTime) });
    }
    if (currentIdx >= 2) {
      baseTime.setHours(baseTime.getHours() + randomBetween(2, 12));
      events.push({ type: 'IN_TRANSIT', branchId: null, description: 'Package in transit to hub', timestamp: new Date(baseTime) });
    }
    if (currentIdx >= 3) {
      baseTime.setHours(baseTime.getHours() + randomBetween(6, 48));
      events.push({ type: 'ARRIVED_AT_HUB', branchId: shipment.destinationBranchId, description: 'Arrived at destination hub', timestamp: new Date(baseTime) });
    }
    if (currentIdx >= 4) {
      baseTime.setHours(baseTime.getHours() + randomBetween(1, 8));
      events.push({ type: 'OUT_FOR_DELIVERY', branchId: shipment.destinationBranchId, description: 'Out for delivery to receiver', timestamp: new Date(baseTime) });
    }
    if (currentIdx >= 5) {
      baseTime.setHours(baseTime.getHours() + randomBetween(1, 6));
      events.push({ type: 'DELIVERED', branchId: shipment.destinationBranchId, description: 'Package delivered to receiver', timestamp: new Date(baseTime) });
    }

    if (shipment.status === 'EXCEPTION') {
      baseTime.setHours(baseTime.getHours() + randomBetween(1, 24));
      events.push({ type: 'EXCEPTION', branchId: null, description: randomItem(['Address not found', 'Receiver unavailable', 'Damaged packaging', 'Weather delay', 'Vehicle breakdown']), timestamp: new Date(baseTime) });
    }

    for (const evt of events) {
      await prisma.shipmentEvent.create({
        data: { shipmentId: shipment.id, type: evt.type as any, branchId: evt.branchId, description: evt.description, timestamp: evt.timestamp },
      });
      eventCount++;
    }
  }
  console.log(`   ✓ ${eventCount} shipment events created`);

  // 8. Seed Invoices
  console.log('🧾 Seeding invoices...');
  const deliveredOrInTransit = await prisma.shipment.findMany({
    where: { status: { in: ['DELIVERED', 'IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY'] } },
    select: { id: true, clientId: true, weightKg: true, serviceType: true, createdAt: true },
  });
  let invoiceCount = 0;

  for (const s of deliveredOrInTransit) {
    const basePricePerKg = { CARGO: 5000, PROJECT_CARGO: 8000, VEHICLE_HEAVY_EQUIPMENT: 12000, EXPORT: 10000, IMPORT: 10000 }[s.serviceType] ?? 5000;
    const subtotal = s.weightKg * basePricePerKg * randomFloat(0.8, 1.2, 2);
    const taxAmount = subtotal * 0.11; // PPN 11%
    const totalAmount = subtotal + taxAmount;
    const issuedDate = new Date(s.createdAt);
    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const invoiceStatuses: ('DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE')[] = ['PAID', 'PAID', 'PAID', 'SENT', 'PARTIAL', 'OVERDUE'];
    const status = randomItem(invoiceStatuses);

    await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(invoiceCount + 1),
        shipmentId: s.id,
        clientId: s.clientId,
        subtotal: parseFloat(subtotal.toFixed(0)),
        taxAmount: parseFloat(taxAmount.toFixed(0)),
        totalAmount: parseFloat(totalAmount.toFixed(0)),
        status,
        issuedDate,
        dueDate,
        paidDate: status === 'PAID' ? new Date(dueDate.getTime() - randomBetween(1, 15) * 86400000) : null,
        paidAmount: status === 'PAID' ? parseFloat(totalAmount.toFixed(0)) : status === 'PARTIAL' ? parseFloat((totalAmount * 0.5).toFixed(0)) : 0,
      },
    });
    invoiceCount++;
  }
  console.log(`   ✓ ${invoiceCount} invoices created`);

  // 9. Seed Cost Entries
  console.log('💰 Seeding cost entries...');
  let costCount = 0;
  for (const s of deliveredOrInTransit) {
    const numCosts = randomBetween(1, 4);
    for (let c = 0; c < numCosts; c++) {
      const category = randomItem([...costCategories]);
      const amount = randomBetween(50000, 5000000);
      await prisma.costEntry.create({
        data: {
          shipmentId: s.id,
          category,
          amount,
          description: `${category.toLowerCase().replace('_', ' ')} charge`,
          vendorName: Math.random() > 0.5 ? randomItem(['PT Pertamina', 'Jasa Marga', 'PT ASDP', 'CV Maju Jaya', 'UD Berkah']) : null,
          incurredDate: s.createdAt,
        },
      });
      costCount++;
    }
  }
  console.log(`   ✓ ${costCount} cost entries created`);

  // 10. Seed AI Decisions (sample)
  console.log('🤖 Seeding AI decisions...');
  const sampleShipments = await prisma.shipment.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: { id: true, weightKg: true, serviceType: true, routeId: true },
  });
  let decisionCount = 0;
  for (const s of sampleShipments) {
    const st = randomItem(['AI_RECOMMENDED', 'HUMAN_APPROVED', 'HUMAN_OVERRIDDEN', 'EXECUTED'] as const);
    const decider = randomItem(users.filter((u) => ['ADMIN', 'OPS_MANAGER', 'DISPATCHER'].includes(u.role)));
    const now = new Date();
    await prisma.decision.create({
      data: {
        type: randomItem(['SHIPMENT_ROUTING', 'PRICING', 'DISPATCH'] as const),
        entityType: 'Shipment',
        entityId: s.id,
        aiRecommendation: { suggestedAction: 'route_via_hub', route: 'JKT-SMG-SBY', routeId: s.routeId, estimatedSaving: randomBetween(50000, 500000) },
        aiConfidence: randomFloat(0.7, 0.98, 2),
        aiReasoning: randomItem([
          'Historical data shows this route has 15% lower cost during this time period.',
          'Current vehicle utilization at origin hub is 85%. Recommend consolidation.',
          'Weather forecast indicates potential delays on direct route. Suggest alternate.',
          'Client has premium SLA. Recommend express routing to meet deadline.',
          'Cost optimization: sea route saves 40% vs air with acceptable delay.',
        ]),
        modelInputSnapshot: { weightKg: s.weightKg, serviceType: s.serviceType, lane: 'sample' },
        status: st,
        decidedById: st === 'AI_RECOMMENDED' ? null : decider.id,
        decidedAt: st === 'AI_RECOMMENDED' ? null : new Date(now.getTime() - randomBetween(1, 48) * 3600000),
        executedAt: st === 'EXECUTED' ? new Date(now.getTime() - randomBetween(1, 24) * 3600000) : null,
      },
    });
    decisionCount++;
  }
  console.log(`   ✓ ${decisionCount} AI decisions created`);

  console.log('\n✅ Database seed completed successfully!');
  if (devTag) {
    console.log('\n🔐 SEED_DEV_RANDOM — log in with this password (all seeded users):');
    console.log(`   Password: ${plainPassword}\n`);
    for (const u of userSeeds) {
      console.log(`   ${u.role.padEnd(16)} ${emailFor(u.localPart)}`);
    }
    console.log('');
  } else {
    console.log('\n   All seeded users use password: password123\n');
  }
  console.log(`
  Summary:
  ─────────────────────────
  Branches:        ${branches.length}
  Users:           ${users.length}
  Clients:         ${clients.length}
  Vehicles:        ${vehicles.length}
  Routes:          ${routes.length}
  Shipments:       ${shipmentCount}
  Shipment Events: ${eventCount}
  Invoices:        ${invoiceCount}
  Cost Entries:    ${costCount}
  AI Decisions:    ${decisionCount}
  ─────────────────────────
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
