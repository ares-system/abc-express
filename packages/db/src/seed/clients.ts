// ============================================
// ABC Express AIP — Mock Data: Clients
// Mix of corporate and individual Indonesian clients
// ============================================

export interface ClientSeed {
  code: string;
  name: string;
  type: 'INDIVIDUAL' | 'CORPORATE' | 'GOVERNMENT';
  companyName: string | null;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  province: string;
  npwp: string | null;
  creditLimit: number;
}

const corporateClients: ClientSeed[] = [
  { code: 'CLT-C001', name: 'PT Astra International', type: 'CORPORATE', companyName: 'PT Astra International Tbk', email: 'logistics@astra.co.id', phone: '021-5089-1234', address: 'Jl. Gaya Motor Raya No.8, Sunter II', city: 'Jakarta', province: 'DKI Jakarta', npwp: '01.234.567.8-012.000', creditLimit: 500000000 },
  { code: 'CLT-C002', name: 'PT Unilever Indonesia', type: 'CORPORATE', companyName: 'PT Unilever Indonesia Tbk', email: 'supply@unilever.co.id', phone: '021-5299-1234', address: 'Jl. BSD Boulevard Barat, Green Office Park', city: 'Tangerang', province: 'Banten', npwp: '01.345.678.9-013.000', creditLimit: 750000000 },
  { code: 'CLT-C003', name: 'PT Semen Indonesia', type: 'CORPORATE', companyName: 'PT Semen Indonesia (Persero) Tbk', email: 'logistik@semenindonesia.com', phone: '031-398-1234', address: 'Jl. Veteran, Gresik', city: 'Gresik', province: 'Jawa Timur', npwp: '01.456.789.0-014.000', creditLimit: 400000000 },
  { code: 'CLT-C004', name: 'PT Telkom Indonesia', type: 'CORPORATE', companyName: 'PT Telkom Indonesia (Persero) Tbk', email: 'procurement@telkom.co.id', phone: '022-452-1234', address: 'Jl. Japati No.1', city: 'Bandung', province: 'Jawa Barat', npwp: '01.567.890.1-015.000', creditLimit: 300000000 },
  { code: 'CLT-C005', name: 'PT Pertamina', type: 'CORPORATE', companyName: 'PT Pertamina (Persero)', email: 'logistik@pertamina.com', phone: '021-381-1234', address: 'Jl. Medan Merdeka Timur 1A', city: 'Jakarta', province: 'DKI Jakarta', npwp: '01.678.901.2-016.000', creditLimit: 1000000000 },
  { code: 'CLT-C006', name: 'PT Freeport Indonesia', type: 'CORPORATE', companyName: 'PT Freeport Indonesia', email: 'supply.chain@freeport.co.id', phone: '021-572-1234', address: 'Plaza 89, Jl. HR Rasuna Said', city: 'Jakarta', province: 'DKI Jakarta', npwp: '01.789.012.3-017.000', creditLimit: 800000000 },
  { code: 'CLT-C007', name: 'PT Indofood', type: 'CORPORATE', companyName: 'PT Indofood Sukses Makmur Tbk', email: 'distribusi@indofood.co.id', phone: '021-569-1234', address: 'Sudirman Plaza, Indofood Tower', city: 'Jakarta', province: 'DKI Jakarta', npwp: '01.890.123.4-018.000', creditLimit: 600000000 },
  { code: 'CLT-C008', name: 'PT Kalbe Farma', type: 'CORPORATE', companyName: 'PT Kalbe Farma Tbk', email: 'logistics@kalbe.co.id', phone: '021-424-1234', address: 'Jl. Let. Jend. Suprapto, Cempaka Putih', city: 'Jakarta', province: 'DKI Jakarta', npwp: '01.901.234.5-019.000', creditLimit: 350000000 },
  { code: 'CLT-C009', name: 'PT Toyota Astra Motor', type: 'CORPORATE', companyName: 'PT Toyota Astra Motor', email: 'parts.logistics@toyota.co.id', phone: '021-651-1234', address: 'Jl. Yos Sudarso, Sunter', city: 'Jakarta', province: 'DKI Jakarta', npwp: '02.012.345.6-020.000', creditLimit: 450000000 },
  { code: 'CLT-C010', name: 'PT Gudang Garam', type: 'CORPORATE', companyName: 'PT Gudang Garam Tbk', email: 'supply@gudanggaram.com', phone: '0354-682-1234', address: 'Jl. Semampir II/1', city: 'Kediri', province: 'Jawa Timur', npwp: '02.123.456.7-021.000', creditLimit: 500000000 },
  { code: 'CLT-C011', name: 'PT Wilmar International', type: 'CORPORATE', companyName: 'PT Wilmar Nabati Indonesia', email: 'logistics@wilmar.co.id', phone: '031-329-1234', address: 'Jl. Tanjung Perak Timur', city: 'Surabaya', province: 'Jawa Timur', npwp: '02.234.567.8-022.000', creditLimit: 700000000 },
  { code: 'CLT-C012', name: 'PT Bukit Asam', type: 'CORPORATE', companyName: 'PT Bukit Asam Tbk', email: 'logistik@bukitasam.co.id', phone: '0734-451-1234', address: 'Jl. Parigi No.1, Tanjung Enim', city: 'Muara Enim', province: 'Sumatera Selatan', npwp: '02.345.678.9-023.000', creditLimit: 400000000 },
  { code: 'CLT-C013', name: 'PT Adaro Energy', type: 'CORPORATE', companyName: 'PT Adaro Energy Indonesia Tbk', email: 'procurement@adaro.com', phone: '021-521-1234', address: 'Menara Karya, Jl. HR Rasuna Said', city: 'Jakarta', province: 'DKI Jakarta', npwp: '02.456.789.0-024.000', creditLimit: 500000000 },
  { code: 'CLT-C014', name: 'PT Lion Air', type: 'CORPORATE', companyName: 'PT Lion Mentari Airlines', email: 'cargo@lionair.co.id', phone: '021-633-1234', address: 'Lion Air Tower, Jl. Gajah Mada', city: 'Jakarta', province: 'DKI Jakarta', npwp: '02.567.890.1-025.000', creditLimit: 300000000 },
  { code: 'CLT-C015', name: 'PT Mayora Indah', type: 'CORPORATE', companyName: 'PT Mayora Indah Tbk', email: 'distribusi@mayora.co.id', phone: '021-520-1234', address: 'Jl. Tomang Raya No.21-23', city: 'Jakarta', province: 'DKI Jakarta', npwp: '02.678.901.2-026.000', creditLimit: 350000000 },
];

const governmentClients: ClientSeed[] = [
  { code: 'CLT-G001', name: 'Kementerian PUPR', type: 'GOVERNMENT', companyName: 'Kementerian Pekerjaan Umum dan Perumahan Rakyat', email: 'logistik@pu.go.id', phone: '021-722-1234', address: 'Jl. Pattimura No.20', city: 'Jakarta', province: 'DKI Jakarta', npwp: '00.111.222.3-011.000', creditLimit: 200000000 },
  { code: 'CLT-G002', name: 'Kementerian Pertahanan', type: 'GOVERNMENT', companyName: 'Kementerian Pertahanan RI', email: 'logistik@kemhan.go.id', phone: '021-384-1234', address: 'Jl. Medan Merdeka Barat No.13-14', city: 'Jakarta', province: 'DKI Jakarta', npwp: '00.222.333.4-012.000', creditLimit: 300000000 },
  { code: 'CLT-G003', name: 'PLN', type: 'GOVERNMENT', companyName: 'PT PLN (Persero)', email: 'logistik@pln.co.id', phone: '021-725-1234', address: 'Jl. Trunojoyo Blok M-I/135', city: 'Jakarta', province: 'DKI Jakarta', npwp: '00.333.444.5-013.000', creditLimit: 500000000 },
  { code: 'CLT-G004', name: 'Pemkot Surabaya', type: 'GOVERNMENT', companyName: 'Pemerintah Kota Surabaya', email: 'logistik@surabaya.go.id', phone: '031-531-1234', address: 'Jl. Jimerto No.25-27', city: 'Surabaya', province: 'Jawa Timur', npwp: '00.444.555.6-014.000', creditLimit: 100000000 },
  { code: 'CLT-G005', name: 'Pemprov Papua', type: 'GOVERNMENT', companyName: 'Pemerintah Provinsi Papua', email: 'logistik@papua.go.id', phone: '0967-531-5678', address: 'Jl. Soa Siu Dok II', city: 'Jayapura', province: 'Papua', npwp: '00.555.666.7-015.000', creditLimit: 150000000 },
];

const individualClients: ClientSeed[] = Array.from({ length: 30 }, (_, i) => {
  const cities = [
    { city: 'Jakarta', province: 'DKI Jakarta' },
    { city: 'Surabaya', province: 'Jawa Timur' },
    { city: 'Bandung', province: 'Jawa Barat' },
    { city: 'Medan', province: 'Sumatera Utara' },
    { city: 'Makassar', province: 'Sulawesi Selatan' },
    { city: 'Semarang', province: 'Jawa Tengah' },
    { city: 'Palembang', province: 'Sumatera Selatan' },
    { city: 'Balikpapan', province: 'Kalimantan Timur' },
    { city: 'Denpasar', province: 'Bali' },
    { city: 'Yogyakarta', province: 'DI Yogyakarta' },
  ];
  const firstNames = ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Eko', 'Rina', 'Hendra', 'Lina', 'Agus', 'Maya', 'Dani', 'Yuli', 'Arif', 'Nisa', 'Wahyu', 'Fitri', 'Reza', 'Anita', 'Irwan', 'Sari', 'Joko', 'Mega', 'Bagus', 'Putri', 'Fajar', 'Diana', 'Rizky', 'Indah', 'Taufik', 'Wulan'];
  const lastNames = ['Santoso', 'Wijaya', 'Pratama', 'Susanto', 'Hartono', 'Setiawan', 'Kurniawan', 'Hidayat', 'Nugroho', 'Saputra', 'Wibowo', 'Putra', 'Rahayu', 'Permata', 'Suryadi'];
  const loc = cities[i % cities.length]!;
  const fn = firstNames[i]!;
  const ln = lastNames[i % lastNames.length]!;
  return {
    code: `CLT-I${String(i + 1).padStart(3, '0')}`,
    name: `${fn} ${ln}`,
    type: 'INDIVIDUAL' as const,
    companyName: null,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@gmail.com`,
    phone: `08${String(1100000000 + i * 7654321).slice(0, 10)}`,
    address: `Jl. Merdeka No.${10 + i}, ${loc.city}`,
    city: loc.city,
    province: loc.province,
    npwp: null,
    creditLimit: 10000000 + (i % 5) * 5000000,
  };
});

export const clientSeeds: ClientSeed[] = [
  ...corporateClients,
  ...governmentClients,
  ...individualClients,
];
