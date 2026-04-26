// ============================================
// ABC Express AIP — Mock Data: Branch Locations
// Based on real ABC Express office locations from kontak.md
// ============================================

export interface BranchSeed {
  code: string;
  name: string;
  city: string;
  province: string;
  region: string;
  type: 'HUB' | 'BRANCH' | 'AGENT' | 'WAREHOUSE' | 'PORT';
  address: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  capacity: number;
}

export const branchSeeds: BranchSeed[] = [
  // ---- JAWA (Main Hubs) ----
  { code: 'JKT-HUB', name: 'Jakarta Hub (HQ)', city: 'Jakarta', province: 'DKI Jakarta', region: 'Jawa', type: 'HUB', address: 'Jl. Raya Cakung Cilincing, Jakarta Utara', phone: '021-44832888', latitude: -6.1751, longitude: 106.8650, capacity: 5000 },
  { code: 'SBY-HUB', name: 'Surabaya Hub', city: 'Surabaya', province: 'Jawa Timur', region: 'Jawa', type: 'HUB', address: 'Jl. Rungkut Industri Raya, Surabaya', phone: '031-8432100', latitude: -7.2575, longitude: 112.7521, capacity: 4000 },
  { code: 'SMG-HUB', name: 'Semarang Hub', city: 'Semarang', province: 'Jawa Tengah', region: 'Jawa', type: 'HUB', address: 'Jl. Kaligawe Raya KM 5, Semarang', phone: '024-6580123', latitude: -6.9666, longitude: 110.4196, capacity: 3000 },
  { code: 'BDG-BRC', name: 'Bandung Branch', city: 'Bandung', province: 'Jawa Barat', region: 'Jawa', type: 'BRANCH', address: 'Jl. Soekarno Hatta No. 567, Bandung', phone: '022-7312456', latitude: -6.9175, longitude: 107.6191, capacity: 1500 },
  { code: 'YOG-BRC', name: 'Yogyakarta Branch', city: 'Yogyakarta', province: 'DI Yogyakarta', region: 'Jawa', type: 'BRANCH', address: 'Jl. Ring Road Utara, Yogyakarta', phone: '0274-623456', latitude: -7.7956, longitude: 110.3695, capacity: 1200 },
  { code: 'CRB-BRC', name: 'Cirebon Branch', city: 'Cirebon', province: 'Jawa Barat', region: 'Jawa', type: 'BRANCH', address: 'Jl. Tuparev No. 89, Cirebon', phone: '0231-234567', latitude: -6.7320, longitude: 108.5523, capacity: 800 },
  { code: 'SLO-BRC', name: 'Solo Branch', city: 'Solo', province: 'Jawa Tengah', region: 'Jawa', type: 'BRANCH', address: 'Jl. Adi Sucipto No. 123, Solo', phone: '0271-712345', latitude: -7.5755, longitude: 110.8243, capacity: 1000 },
  { code: 'MLG-BRC', name: 'Malang Branch', city: 'Malang', province: 'Jawa Timur', region: 'Jawa', type: 'BRANCH', address: 'Jl. Letjen Sutoyo No. 45, Malang', phone: '0341-362345', latitude: -7.9666, longitude: 112.6326, capacity: 900 },
  { code: 'TGR-WHS', name: 'Tangerang Warehouse', city: 'Tangerang', province: 'Banten', region: 'Jawa', type: 'WAREHOUSE', address: 'Jl. MH Thamrin, Tangerang', phone: '021-55712345', latitude: -6.1781, longitude: 106.6319, capacity: 3000 },
  { code: 'BKS-BRC', name: 'Bekasi Branch', city: 'Bekasi', province: 'Jawa Barat', region: 'Jawa', type: 'BRANCH', address: 'Jl. Ahmad Yani No. 78, Bekasi', phone: '021-88345678', latitude: -6.2349, longitude: 106.9896, capacity: 1200 },

  // ---- SUMATRA ----
  { code: 'MDN-HUB', name: 'Medan Hub', city: 'Medan', province: 'Sumatera Utara', region: 'Sumatra', type: 'HUB', address: 'Jl. Gatot Subroto KM 7, Medan', phone: '061-8012345', latitude: 3.5952, longitude: 98.6722, capacity: 3000 },
  { code: 'PLB-BRC', name: 'Palembang Branch', city: 'Palembang', province: 'Sumatera Selatan', region: 'Sumatra', type: 'BRANCH', address: 'Jl. Kolonel H. Burlian, Palembang', phone: '0711-410123', latitude: -2.9761, longitude: 104.7754, capacity: 1500 },
  { code: 'PKB-BRC', name: 'Pekanbaru Branch', city: 'Pekanbaru', province: 'Riau', region: 'Sumatra', type: 'BRANCH', address: 'Jl. Soekarno Hatta, Pekanbaru', phone: '0761-572345', latitude: 0.5071, longitude: 101.4478, capacity: 1200 },
  { code: 'PDG-BRC', name: 'Padang Branch', city: 'Padang', province: 'Sumatera Barat', region: 'Sumatra', type: 'BRANCH', address: 'Jl. By Pass, Padang', phone: '0751-445678', latitude: -0.9471, longitude: 100.4172, capacity: 1000 },
  { code: 'BDL-BRC', name: 'Bandar Lampung Branch', city: 'Bandar Lampung', province: 'Lampung', region: 'Sumatra', type: 'BRANCH', address: 'Jl. Soekarno Hatta, Bandar Lampung', phone: '0721-780123', latitude: -5.4500, longitude: 105.2667, capacity: 1200 },
  { code: 'JMB-BRC', name: 'Jambi Branch', city: 'Jambi', province: 'Jambi', region: 'Sumatra', type: 'BRANCH', address: 'Jl. Lintas Sumatera, Jambi', phone: '0741-445566', latitude: -1.6101, longitude: 103.6131, capacity: 800 },
  { code: 'BTM-BRC', name: 'Batam Branch', city: 'Batam', province: 'Kepulauan Riau', region: 'Sumatra', type: 'BRANCH', address: 'Jl. Laksamana Bintan, Batam', phone: '0778-431234', latitude: 1.0456, longitude: 104.0305, capacity: 1000 },
  { code: 'BKL-AGT', name: 'Bengkulu Agent', city: 'Bengkulu', province: 'Bengkulu', region: 'Sumatra', type: 'AGENT', address: 'Jl. S. Parman, Bengkulu', phone: '0736-341234', latitude: -3.8004, longitude: 102.2655, capacity: 400 },
  { code: 'BLT-PRT', name: 'Belawan Port', city: 'Belawan', province: 'Sumatera Utara', region: 'Sumatra', type: 'PORT', address: 'Pelabuhan Belawan, Medan', phone: '061-6941234', latitude: 3.7772, longitude: 98.6833, capacity: 2000 },

  // ---- KALIMANTAN ----
  { code: 'BPN-HUB', name: 'Balikpapan Hub', city: 'Balikpapan', province: 'Kalimantan Timur', region: 'Kalimantan', type: 'HUB', address: 'Jl. MT Haryono, Balikpapan', phone: '0542-735678', latitude: -1.2379, longitude: 116.8529, capacity: 2500 },
  { code: 'BJM-BRC', name: 'Banjarmasin Branch', city: 'Banjarmasin', province: 'Kalimantan Selatan', region: 'Kalimantan', type: 'BRANCH', address: 'Jl. A. Yani KM 6, Banjarmasin', phone: '0511-3261234', latitude: -3.3194, longitude: 114.5908, capacity: 1200 },
  { code: 'PTK-BRC', name: 'Pontianak Branch', city: 'Pontianak', province: 'Kalimantan Barat', region: 'Kalimantan', type: 'BRANCH', address: 'Jl. Ahmad Yani, Pontianak', phone: '0561-734567', latitude: -0.0263, longitude: 109.3425, capacity: 1000 },
  { code: 'SMD-BRC', name: 'Samarinda Branch', city: 'Samarinda', province: 'Kalimantan Timur', region: 'Kalimantan', type: 'BRANCH', address: 'Jl. Provinsi, Samarinda', phone: '0541-741234', latitude: -0.4948, longitude: 117.1436, capacity: 1000 },
  { code: 'PLK-BRC', name: 'Palangkaraya Branch', city: 'Palangka Raya', province: 'Kalimantan Tengah', region: 'Kalimantan', type: 'BRANCH', address: 'Jl. Tjilik Riwut, Palangka Raya', phone: '0536-321234', latitude: -2.2136, longitude: 113.9108, capacity: 700 },
  { code: 'TRK-AGT', name: 'Tarakan Agent', city: 'Tarakan', province: 'Kalimantan Utara', region: 'Kalimantan', type: 'AGENT', address: 'Jl. Yos Sudarso, Tarakan', phone: '0551-321234', latitude: 3.3274, longitude: 117.5785, capacity: 500 },

  // ---- SULAWESI ----
  { code: 'MKS-HUB', name: 'Makassar Hub', city: 'Makassar', province: 'Sulawesi Selatan', region: 'Sulawesi', type: 'HUB', address: 'Jl. Perintis Kemerdekaan KM 12, Makassar', phone: '0411-441234', latitude: -5.1477, longitude: 119.4327, capacity: 2500 },
  { code: 'MND-BRC', name: 'Manado Branch', city: 'Manado', province: 'Sulawesi Utara', region: 'Sulawesi', type: 'BRANCH', address: 'Jl. AA Maramis, Manado', phone: '0431-851234', latitude: 1.4748, longitude: 124.8421, capacity: 800 },
  { code: 'PLU-BRC', name: 'Palu Branch', city: 'Palu', province: 'Sulawesi Tengah', region: 'Sulawesi', type: 'BRANCH', address: 'Jl. Trans Sulawesi, Palu', phone: '0451-421234', latitude: -0.8917, longitude: 119.8707, capacity: 700 },
  { code: 'KDR-BRC', name: 'Kendari Branch', city: 'Kendari', province: 'Sulawesi Tenggara', region: 'Sulawesi', type: 'BRANCH', address: 'Jl. MT Haryono, Kendari', phone: '0401-321234', latitude: -3.9985, longitude: 122.5130, capacity: 600 },

  // ---- BALI & NUSA TENGGARA ----
  { code: 'DPS-BRC', name: 'Denpasar Branch', city: 'Denpasar', province: 'Bali', region: 'Bali & Nusa Tenggara', type: 'BRANCH', address: 'Jl. Cargo Permai, Denpasar', phone: '0361-721234', latitude: -8.6705, longitude: 115.2126, capacity: 1200 },
  { code: 'MTR-BRC', name: 'Mataram Branch', city: 'Mataram', province: 'Nusa Tenggara Barat', region: 'Bali & Nusa Tenggara', type: 'BRANCH', address: 'Jl. Sriwijaya, Mataram', phone: '0370-621234', latitude: -8.5833, longitude: 116.1167, capacity: 700 },
  { code: 'KPG-BRC', name: 'Kupang Branch', city: 'Kupang', province: 'Nusa Tenggara Timur', region: 'Bali & Nusa Tenggara', type: 'BRANCH', address: 'Jl. Timor Raya, Kupang', phone: '0380-821234', latitude: -10.1772, longitude: 123.6070, capacity: 600 },

  // ---- MALUKU & PAPUA ----
  { code: 'AMB-BRC', name: 'Ambon Branch', city: 'Ambon', province: 'Maluku', region: 'Maluku & Papua', type: 'BRANCH', address: 'Jl. Dr. Malaihollo, Ambon', phone: '0911-341234', latitude: -3.6954, longitude: 128.1814, capacity: 500 },
  { code: 'JYP-BRC', name: 'Jayapura Branch', city: 'Jayapura', province: 'Papua', region: 'Maluku & Papua', type: 'BRANCH', address: 'Jl. Raya Abepura, Jayapura', phone: '0967-531234', latitude: -2.5337, longitude: 140.7181, capacity: 600 },
  { code: 'SRG-BRC', name: 'Sorong Branch', city: 'Sorong', province: 'Papua Barat', region: 'Maluku & Papua', type: 'BRANCH', address: 'Jl. Basuki Rahmat, Sorong', phone: '0951-321234', latitude: -0.8616, longitude: 131.2550, capacity: 500 },
  { code: 'TIM-BRC', name: 'Timika Branch', city: 'Timika', province: 'Papua Tengah', region: 'Maluku & Papua', type: 'BRANCH', address: 'Jl. Cenderawasih, Timika', phone: '0901-321234', latitude: -4.5282, longitude: 136.8875, capacity: 400 },
  { code: 'MNK-AGT', name: 'Merauke Agent', city: 'Merauke', province: 'Papua Selatan', region: 'Maluku & Papua', type: 'AGENT', address: 'Jl. Raya Mandala, Merauke', phone: '0971-321234', latitude: -8.4932, longitude: 140.4018, capacity: 300 },

  // ---- PORTS ----
  { code: 'TJP-PRT', name: 'Tanjung Priok Port', city: 'Jakarta', province: 'DKI Jakarta', region: 'Jawa', type: 'PORT', address: 'Pelabuhan Tanjung Priok, Jakarta Utara', phone: '021-43912345', latitude: -6.1053, longitude: 106.8764, capacity: 5000 },
  { code: 'TPS-PRT', name: 'Tanjung Perak Port', city: 'Surabaya', province: 'Jawa Timur', region: 'Jawa', type: 'PORT', address: 'Pelabuhan Tanjung Perak, Surabaya', phone: '031-3291234', latitude: -7.2000, longitude: 112.7333, capacity: 4000 },
  { code: 'MKS-PRT', name: 'Makassar Port', city: 'Makassar', province: 'Sulawesi Selatan', region: 'Sulawesi', type: 'PORT', address: 'Pelabuhan Soekarno-Hatta, Makassar', phone: '0411-3171234', latitude: -5.1127, longitude: 119.4090, capacity: 3000 },
];
