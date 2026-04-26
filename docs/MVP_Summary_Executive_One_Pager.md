# AI Agentic ABC Express — ringkasan eksekutif (1 halaman)

**Ringkasan eksekutif.** Inisiatif ini mengarah pada **sistem operasi data**, bukan pada antarmuka percakapan semata. Urutan yang dipegang: *model data → alur kerja → mesin keputusan → antarmuka kecerdasan buatan*—supaya risiko teridentifikasi, skenario dapat diuji, tindakan (secara bertahap) tereksekusi, dan keputusan meninggalkan jejak audit.

Secara jangka panjang, penguatan posisi perusahaan didukung oleh **jaringan operasional** dan **kualitas keputusan berbasis data yang konsolidatif**, di samping penguatan aset fisik. Pengembangan lapisan ontologi dan kecerdasan buatan dipercepat melalui kemitraan strategis dengan **Daemon** dan **Blockint Technologies**. Kewenangan domain bisnis, penentuan arah produk, serta akses terhadap sumber data—melalui mekanisme *Business Owner* dan tata kelola yang disepakati—tetap berada di **ABC Express**.

---

## Tiga krisis data yang harus diselesaikan sebelum pemanfaatan AI ditingkatkan

| Masalah | Dampak / indikasi |
|--------|--------------------|
| **Visibilitas komersial** | Sebagian besar pelanggan tidak tercatat memadai dalam aktivitas *sales* terstruktur; risiko *churn* dan hilangnya peluang signifikan (orde puluhan miliar Rupiah per tahun, menurut analisis sumber). |
| **Kualitas data keuangan grup** | Potensi **double counting** antar entitas (*rantai sirkular* internal) tanpa mekanisme eliminasi otomatis: angka operasional dan konsolidasi memerlukan validasi. |
| **Penggantian basis data operasional** | Volume besar komunikasi *instant messaging* berfungsi sebagai catatan operasional tidak terstruktur: keterbatasan kueri, retensi, dan kelaikan audit. |

Peningkatan kapabilitas AI tanpa keseimbangan data berisiko memperlebar distorsi keputusan. Penataan sumber data mendahulu prioritas pemanfaatan AI skala penuh.

---

## Tujuan arsitektur (7 lapisan, satu narasi)

1. **Ontology perusahaan** — definisi entitas inti (kiriman, segmen jalan, pelanggan, kontrak, cabang, biaya, P&L cabang) beserta relasinya; *Customer* / *Opportunity* memetakan ke segmen (CGL) agar strategi dan pelaporan selaras antar fungsi.  
2. **Ingesti terpadu** — ANTERO/TMS, GPS, keuangan, Excel cabang, saluran *messaging* operasional, sumber tambahan, dipetakan ke **satu sumber kebenaran otoritatif** per fakta.  
3. **Digital operating twin** — representasi *near-real-time* armada, kiriman, gudang, biaya, P&L cabang.  
4. **Lapisan agen (MVP: 5 agen)** — COO, Dispatch, Revenue Leak, Churn, Branch “CEO”; rekomendasi **ter-jejak** pada data.  
5. **Otomasi** — alur notifikasi, estimasi waktu, eskalasi, berkurangnya ketergantungan pada penjadwalan *ad hoc* semata.  
6. **War room eksekutif** — *command center* terpadu, bukan sekumpulan laporan statis.  
7. **Jalur tata kelola dan kesiapan jangka panjang (referensi pasar modal)** — *audit trail*, penanganan *interco*, kepatuhan *transfer pricing*, P&L yang siap diaudit, serta *earnings* yang verifikabel ke sumber datanya.

---

## Roadmap fase (tingkat arahan)

| Fase | Arah | Ilustrasi arah hasil |
|------|------|----------------------|
| **1 — Fondasi (2026 H1–H2)** | Ontology, ingesti, SSoT, *interco*, P&L cabang, *war room* v1 | Data operasional dan pelaporan selaras; pemanfaatan AI penuh mengikuti prasyarat fase |
| **2 — AI operasional** | Lima agen + *war room*; rekomendasi dan **human-in-the-loop** | *Briefing*, *churn* / margin, *dispatch*, terarah ke data |
| **3 — Otonomi bertingkat** | Otonomi ditingkatkan secara bertahap berdasarkan bukti; bukan skenario “*big-bang*” sekaligus | Pengurangan hambatan proses, pengendalian risiko per domain |
| **4 — Governance & IPO AI** | *Data room* investasi, *audit intelligence*, *earnings* yang dapat dipertanggungjawabkan | Orientasi tata kelola perusahaan terbuka, bukan hanya fitur perangkat lunak |

---

## Kemitraan pengembangan: ABC Express — Daemon & Blockint Technologies

| | **ABC Express** (pemilik program & domain) | **Daemon & Blockint Technologies** (pengembang mitra) |
|---|---------------------------------------------|--------------------------------------------------------|
| **Arah peran** | Domain logistik, jaringan, produk, prioritas lini, **pemilikan** ontologi per domain, validasi data, persetujuan strategi | Penguatan teknis: rancangan ontologi, ingesti, agen, evaluasi, disiplin *engineering*, siklus rilis sejalan dokumen fase |
| **Harga yang didambakan** | Kecocokan dengan kebutuhan bisnis, risiko, dan *service level* operasional | Ketercapaian teknis dengan aritektur teruji, dokumentasi (mis. ADR), jaminan kualitas AI |

Kemitraan dimaksudkan untuk mempercepat **Fase 1** (fondasi) dan **Fase 2** (AI operasional), dengan tetap menghormati *gate* antar fase, *hard block* bila *interco* belum tuntas, dan *checklist* verifikasi di dokumen *MVP*—*definition of done* tidak disubstitusi oleh pihak ketiga.

---

## Asumsi untuk tabel sebelum / sesudah (tanpa angka tambahan di luar sumber)

- **A1** — Data kolom *Sebelum* mengacu hanya pada isi `docs/MVP_Summary_AI_AGENTIC_ABC_EXPRESS.md` (krisis, orde risiko, cakupan ANTERO, *dll.*).  
- **A2** — “Kuartal berikutnya” memisalkan manajemen menetapkan arsitektur dan memulai Fase 1; bukan pernyataan penyelesaian penuh dalam satu triwulan.  
- **A3** — “Dua tahun” memisalkan horizon sekitar 24 bulan sejak penguatan serius fondasi, diselaraskan jendela fase pada ringkasan (Fase 1 2026 H1–H2; Fase 2 ke 2027 H1) tanpa proyeksi persentase yang tidak dihitung di dokumen sumber.  
- **A4** — Proyeksi omzet, efisiensi persentase, maupun *payback* bukan cakupan dokumen sumber; tidak ditambahkan di sini.

## Tabel transisi: sebelum / kuartal berikutnya / ~dua tahun

| Dimensi | **Sebelum** (fakta/klaim di ringkasan MVP) | **Kuartal berikutnya** (Fase 1 *dimulai* sesuai A2) | **~Dua tahun** (Fase 1 selesai; Fase 2 *operasional* sesuai A3 + dokumen) |
|--------|---------------------------------------------|--------------------------------------------------------|--------------------------------------------------------------------------------|
| **Visibilitas komersial** | Dari 1.588 pelanggan aktif, hanya **8,4%** tercermin di **58.387** pesan WA Sales; **91,6%** tidak tercatat memadai di saluran *sales* terstruktur. | Penetapan *Customer* / *Opportunity* / CGL dalam ontologi; data strategis diarahkan ke satu sumber; perubahan persentase tidak implisit. | Laporan dan prioritas *sales* mengacu data terstruktur; *agent* *Churn* dan aktivitas tersimpan dalam sistem. |
| **Risiko pendapatan tidak teridentifikasi** | **49** akun *churned* **&gt; Rp100M**, **70** *silent* **&gt; Rp200M** (seperti di ringkasan); risiko **&gt; Rp30 miliar/tahun** tidak terdeteksi. | Pemetaan akun dan interaksi ke entitas dan *event log*; tanpa implikasi penyelamatan penuh tanpa bukti. | Sinyal *churn* / *health* ter-*query*; prioritas memakai peran agen fase 2, tanpa target kuantitatif tambahan. |
| **Konsolidasi / double counting** | Potensi **Rp28,1 miliar**; *rantai sirkular*; *engine* eliminasi *interco* diperlukan. | Aturan dan status *interco* (pending → eliminasi) berlaku di sistem, bukan hanya pada dokumen terpisah. | Penutupan periode *terblokir* bila *interco* masih *pending* (mekanisme sesuai ringkasan). |
| **Operasional berbasis *messaging*** | **90.726** pesan memadukan fungsi *database*; retensi terbatas, audit lemah. | *Log* terstruktur untuk kejadian kritis; saluran lama dipertahankan; bukan asumsi penghapusan total WA. | Keputusan dan SLA memakai *event* + jejak; *messaging* sebagai saluran, bukan *system of record* untuk fakta kritis. |
| **Aset data (ANTERO)** | **43.307** *shipment*, **24.761** *customer*, **7.959** rute. | SSoT dan ontologi sejalan dengan taksonomi lapangan. | *Twin* dan agen (COO, *dispatch*, cabang) berpijak pada fakta yang konsisten dengan finansial. |
| **Keputusan & otomatisasi** | Ketergantungan pada musyawarah ad hoc. | *War room* v1; pengurangan lembar kerja yang tidak selaras. | Lima agen MVP + *war room* fase 2, rekomendasi ter-jejak, *HITL* sesuai dokumen. |
| **Tata kelola & narasi *investable*** | *Audit trail*, TP, P&L ter-*audit*, *earnings*—sasaran jangka panjang. | Kebijakan *traceability*; *owner* domain selain peran teknis semata. | *Readiness* (data room, *audit intelligence*, *earnings*) bila Fase 1–3 terbukti, sesuai Fase 4. |
| **Indikator verifikasi (antar fase)** | *Definition of done* belum menjadi disiplin lintas fungsi. | Penerapan *DoD* Fase 1; *hard block* bila *interco* belum tuntas sebelum tutup. | Peralihan fase hanya bila prasyarat dokumen berikutnya terverifikasi. Lihat tabel berikut. |

### Indikator verifikasi per fase (ringkasan kutipan dokumen sumber)

*Ringkasan di bawah menggambarkan maksud `docs/MVP_Phase_1_…` hingga `docs/MVP_Phase_4_…` (serta prasyarat Fase 2). Bukan target baru yang ditetapkan oleh one-pager ini. Angka dan ambang batas mengikuti dokumen sumber.*

| Fase | Indikator verifikasi (esensi) |
|------|------------------------------|
| **1 — Fondasi** | Enam kriteria *definition of done*: *Shipment Truth*; *Customer Truth* (deduplikasi, CGL, dormancy); *Branch P&L* + **Shadow Pricing**; **ICT elimination**; **War Room v1** per peran; tata kelola (matriks *Business Owner*, ADR, perubahan ontologi ter-*approval*). Di dokumen teknis, penutupan periode **tidak dapat** dilakukan bila masih **IntercoTransaction** berstatus *Pending* — *hard block*. |
| **2 — AI operasional** | Fase 2 tidak memulai sebelum Fase 1 tuntas. Prasyarat meliputi antara lain: *Shipment Truth*; *Customer Truth*; *Branch P&L* (Shadow Pricing); *interco* + *hard block* bila *pending* belum nol; *event* per *state change*; **War Room v1** per peran. |
| **3 — Otonomi** | Peralihan bila kriteria Fase 2 tuntas dan prasyarat Fase 3 di dokumen terpenuhi (antara lain memori agen, *audit trail*, sinyal penerimaan/penolakan, otonomi bertingkat, persetujuan pimpinan atas kebijakan otonomi). |
| **4 — Governance & IPO** | Peralihan bila kondisi Fase 4 di dokumen terpenuhi dan teruji (antara lain kesiapan *pre-audit*, riwayat finansial ter-*audit*, *earnings* terekam, *interco* rapi sebelum *close*, keterlibatan auditor dan *underwriter*, kesiapan struktur entitas, *dll.*, sesuai sumber). |

*Referensi kutipan:* *Success Criteria* dan *gate* interco — `docs/MVP_Phase_1_AI_AGENTIC_ABC_EXPRESS.md` ; *prasyarat* Fase 2, 3, 4 di awal masing-masing `docs/MVP_Phase_2/3/4_…` .

---

## *Stack* (ringkasan non-teknis)

| Lapisan | Arah | Keterangan |
|---------|------|------------|
| Data | Otoritatif, ter-audit | Aliran *event* antar modul |
| AI | Agen hibrid, model prediksi, deteksi anomali | Bukan penerapan *large language model* saja |
| Sisi *front-end* / *mobile* | Aplikasi web, *mobile*, *IoT* bila tersedia | Orkestrasi lapangan dan *war room* |

---

## Arah strategis (kesimpulan manajemen)

Kualitas peta data dan ontologi menentukan kualitas output keputusan yang dibantu AI. Investasi arsitektur data ini menyangkut skalabilitas operasi dan, bila dikehendaki, **kelayakan narasi** bagi pemangku kepentingan eksternal (termasuk kesiapan informasi *investable* / jalur pencatatan efek, sesuai pilihan strategis perusahaan). Kemitraan pengembangan dapat mempercepat pencapaian *time-to-trust* pada lapisan ontologi dan agen, dengan syarat: satu peta jalan yang disepakati, *Business Owner* jelas, kriteria selesai fase diverifikasi, dan tidak munculnya dua sumber *kebenaran* yang saling bertentangan antara perusahaan dan mitra.

---

*Dokumen ini meringkas isi `docs/MVP_Summary_AI_AGENTIC_ABC_EXPRESS.md` serta konteks kemitraan. Rincian objek, agen, dan urutan teknis pada dokumen sumber fase (`MVP_Phase_1` *dan seterusnya*).*
