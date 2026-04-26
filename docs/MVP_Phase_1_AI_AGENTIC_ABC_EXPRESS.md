<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Oke, skrng mulai buat  MVP Phase 1 AI AGENTIC ABC EXPRESS, kompleks dan detail teknikal (jangan ada code, tpi full penjelasan teknikal).

Ini adalah **MVP Phase 1 AI Agentic ABC Express** — blueprint teknikal penuh, tanpa kode, tapi sangat dalam dan operasional.

***

# MVP Phase 1 — AI Agentic ABC Express

## *Foundation Year: Data Model → Workflow → Decision Engine*

### *Target: Q2–Q3 2026 | "Sebelum AI apapun masuk, fondasi harus bersih"*


***

## Prinsip Utama Phase 1

Phase 1 bukan tentang membangun AI. Phase 1 adalah tentang membuat AI yang akan dibangun di Phase 2 **tidak bodoh**. Jika ontology belum ada, jika data masih tersebar, jika double-counting belum selesai — maka apapun yang dibangun di atasnya akan menghasilkan keputusan yang salah dan mempercepat chaos. Urutan yang tidak bisa dinegosiasikan:[^1][^2]

```
Enterprise Ontology v1  
    ↓  
Unified Data Ingestion  
    ↓  
Single Source of Truth (3 Domain Inti)  
    ↓  
IntercoTransaction Elimination Engine  
    ↓  
Branch P&L Live  
    ↓  
Executive War Room Dashboard v1  
```


***

## Komponen 1 — Enterprise Ontology Engine

### 1.1 Apa yang Dibangun

Ontology Engine adalah **lapisan semantik sentral** yang berdiri di antara semua data mentah dan semua aplikasi yang menggunakannya. Ini bukan database biasa. Ini adalah **"bahasa bersama" seluruh organisasi ABC Express** — mendefinisikan secara formal apa saja entitas bisnis inti, atribut apa yang mereka miliki, bagaimana mereka saling terhubung, dan tindakan apa yang dapat dilakukan terhadap mereka.[^1]

Tanpa ini, setiap divisi punya definisi "customer" sendiri. Finance menyebut customer sebagai entitas billing. Ops menyebut customer sebagai pemilik shipment. Sales menyebut customer sebagai target pipeline. Ketiganya benar dari sudut pandang masing-masing — tapi ketika digabungkan, data menjadi tidak bisa dipercaya.[^1]

### 1.2 Wave Implementation

Berdasarkan dokumen ABC Express, ontology dibangun dalam 4 Wave selama 12 bulan. **Phase 1 MVP mengeksekusi Wave 1 dan Wave 2**:[^1]

#### Wave 1 — Core Objects (Juli–September 2026)

Ini adalah 5 objek paling fundamental. Tanpa ini, tidak ada yang bisa berjalan.

**Objek SHP — Shipment (Master Record Kiriman)**

Shipment adalah atom terkecil dari bisnis ABC Express. Setiap kiriman adalah satu Shipment record dengan:

- **10 lifecycle states yang wajib dipatuhi:** `Draft → Confirmed → PickedUp → InTransit → AtHub → OutForDelivery → Delivered → Exception → Cancelled → Closed`
- **Atribut SLA kritis:** `committedDeliveryAt` (janji pengiriman ke customer) vs `actualDeliveryAt` (realisasi) — dari keduanya lahir OTIF tracking yang akurat
- **Atribut billing:** `chargeableWeight = max(actualWeight, volumetricWeight)` — rule ini harus terdefinisi di ontology, bukan di Excel masing-masing admin cabang
- **Mandatory constraint:** setiap Shipment **wajib ter-atribut ke satu LegalEntity** — apakah ini milik PT Antero atau PT Arandy. Tanpa constraint ini, double-counting Rp28,1 miliar akan terus terjadi[^3]

**Objek LEG — Shipment Leg (Segmen Perjalanan)**

Satu Shipment bisa memiliki banyak Leg — Jakarta ke Surabaya lewat darat, lalu Surabaya ke Makassar lewat laut, lalu Makassar ke pedalaman via motor kurir. Setiap Leg adalah entitas terpisah dengan:

- `modeOfTransport`: Road / Air / Sea / River / LastMile / Porter
- `carrierType` polymorphic: Internal / Partner / ThirdParty / **LocalHero** — LocalHero adalah *competitive moat* utama ABC Express di area 3T, harus jadi objek formal bukan sekadar kontak WhatsApp[^3]
- `plannedDeparture` vs `actualDeparture`, `plannedArrival` vs `actualArrival` — dari keduanya sistem bisa otomatis detect delay per-leg, bukan hanya delay total shipment
- `costAmount` per leg — ini yang memungkinkan biaya per segmen terlacak, fondasi dari "margin per trip"

**Objek MFT — Manifest (Kumpulan Shipment dalam Satu Armada)**

Manifest adalah kontainer logis dari banyak Shipment yang bergerak dalam satu kendaraan atau penerbangan. Lifecycle Manifest: `Draft → Confirmed → Departed → InTransit → Arrived → Reconciled → Closed`. Yang kritis adalah state `Reconciled` — ini adalah checkpoint di mana sistem memverifikasi bahwa Shipment di dalam Manifest sesuai dengan fisik yang tiba. Discrepancy di sini adalah sinyal awal kerusakan, kehilangan, atau manipulasi.[^3]

**Objek CUS — Customer (Legal Entity Individual)**

Customer bukan sekadar nama. Customer adalah objek dengan lifecycle status:

- `Prospect → Active → Dormant → Churned → Blocked`
- `lastShipmentDate` — field paling penting untuk churn detection. Jika `lastShipmentDate` sudah > 30 hari untuk customer yang biasanya aktif mingguan, sistem bisa flag
- `creditTermDays` dan `creditLimit` dikelola per Customer — karena satu holding bisa punya anak perusahaan dengan credit limit berbeda
- `cglSegmentId` — **wajib tidak boleh null**. Setiap customer harus ter-tag ke CGL1, CGL2, atau CGL3[^3]

**Objek BRN — Branch (Kantor Cabang)**

Branch bukan sekadar lokasi. Branch adalah unit bisnis dengan profil HubRO 3 dimensi:[^1]

- **Network Role:** apakah cabang ini sebagai Gateway Hub (menangani transit nasional), Origin Hub, Destination Hub, atau Station
- **Product Mix:** apakah cabang ini handle reguler saja, atau juga express, heavy cargo, multimoda
- **Coverage Span:** seberapa luas area yang dicakup cabang ini — level kabupaten atau level kecamatan
- Hirarki reporting: `Maluku → Jakarta`, `Bali/NTB/NTT → Surabaya`, `Sulawesi/Maluku Utara → Makassar` — harus terdefinisi formal di ontology agar reporting konsolidasi bisa otomatis

***

#### Wave 2 — Financial Objects (Oktober–Desember 2026)

Ini adalah objek yang memungkinkan Branch P\&L dan eliminasi double-counting.

**Objek INV — Invoice**

Invoice bukan hanya dokumen tagihan. Di ontology, Invoice adalah objek dengan:

- `legalEntityId` — dari entitas mana invoice ini dikeluarkan (Antero atau Arandy)
- `shipmentIds[]` — array of shipment yang di-cover invoice ini. Relasi ini yang mencegah satu shipment di-invoice dua kali
- `paymentStatus`: Unpaid / PartiallyPaid / Paid / Overdue / Disputed
- `agingBucket`: Current / 1-30 / 31-60 / 61-90 / >90 hari — untuk aging receivable tracking otomatis

**Objek ICT — IntercoTransaction (Transaksi Antar-Entitas)**

Ini adalah objek paling kritis untuk IPO readiness. Setiap transaksi antara PT Antero dan PT Arandy — apapun jenisnya — harus masuk sebagai ICT dengan **tiga-state mandatory workflow**:[^1]

```
Pending → Eliminated → Reviewed
```

- **Pending:** transaksi diidentifikasi sebagai interco, belum diproses eliminasi
- **Eliminated:** sistem telah melakukan eliminasi — transaksi ini tidak akan masuk ke konsolidasi
- **Reviewed:** Finance Lead telah memverifikasi eliminasi ini sesuai dengan TP Manual

Selama ada ICT yang masih `Pending` saat period closing, laporan konsolidasi tidak bisa di-finalize. Ini adalah enforcement otomatis — bukan bergantung pada disiplin manual.[^3]

**Objek TPA — TransferPricingActivity**

Transfer Pricing bukan hanya soal pajak — ini adalah cara ABC Express mengukur profitabilitas setiap entitas secara bersih. Setiap Aktivitas A1–A7 dari TP Manual v1.0 harus terdefinisi sebagai TPA object dengan:

- `activityCode`: A1 (Hub Service), A2 (Last-Mile Service), A3 (Document Processing), dst.
- `pricingBasis`: Cost-Plus / Market-Based / Negotiated
- `oecd-compliant flag` — untuk audit readiness
- `effectiveDateFrom` dan `effectiveDateTo` — sehingga ada versi history jika rate berubah

**Objek BPL — BranchPL (Branch Profit \& Loss)**

BranchPL bukan laporan keuangan yang dibuat manual setiap bulan. BranchPL adalah **objek yang di-compute secara otomatis** dari data yang sudah ada di sistem:

- Revenue = sum(Invoice.amount) where `Invoice.branchId = this.branchId` and `paymentStatus = Paid`
- Cost = sum(CostEntry.amount) where `CostEntry.costCenterId` linked to this branch
- Gross Margin = Revenue - Cost
- `periodType`: Monthly / Quarterly
- `status`: Draft / Locked / Audited

Ketika BranchPL di-compute dari data ontology yang bersih, owner bisa lihat profitabilitas setiap cabang tanpa menunggu laporan manual dari Finance.[^2]

***

#### Wave 3 — Commercial & CRM Objects (Q1 2027 — awal Phase 2)

Wave 3 **tidak dieksekusi di Phase 1** — ia dieksekusi di awal Phase 2 sebagai prasyarat langsung sebelum Churn Detection Agent dan Dispatch Agent di-deploy. Objek yang dibangun:

- **OPP — Opportunity**: Deal dalam pipeline 7-state (Prospecting → ClosedWon/Lost). Ini yang memungkinkan pipeline velocity ter-track secara sistematis.
- **QUO — Quote**: Penawaran harga formal dengan lineItems per lane, linked ke Opportunity.
- **CTR — Contract**: MSA / PO / Tender / SpotAgreement dengan autoRenew tracking — basis revenue predictability.
- **SAC — SalesActivity**: Log setiap interaksi sales (Call/Visit/Email/Meeting), linked ke Customer dan Opportunity. Ini yang menggantikan WhatsApp sebagai "database" aktivitas sales.
- **LED — Lead**: Prospek belum qualified, tracked per source channel. Fondasi untuk Commercial Intelligence Agent di Phase 3.
- **CMP — Competitor**: Profil JNE, Pos, SiCepat untuk win/loss analysis — diisi dari data SAC dan OPP yang closed.

Wave 3 selesai sebelum COO Agent dan Churn Detection Agent go-live, karena kedua agent tersebut membutuhkan data SalesActivity dan Opportunity untuk menghasilkan rekomendasi yang akurat.[^1]

***

#### Wave 4 — Network & People Objects (Q2 2027 — mid Phase 2)

Wave 4 dieksekusi di tengah Phase 2, seiring dengan matangnya data operasional dari Wave 1–3. Objek yang dibangun:

- **AGT — Agent**: Mitra agen yang di-onboard ke network ABC, dengan profil coverage dan performance metrics.
- **VND — Vendor**: Subkontraktor transportasi eksternal dengan reliability score — input utama Dispatch Agent.
- **DRV — Driver**: Pengemudi internal maupun vendor, dengan track record per rute.
- **VHL — Vehicle**: Armada fisik dengan telemetri GPS, fuel baseline per rute, dan maintenance schedule.
- **EMP — Employee**: Seluruh karyawan dengan OBL Scorecard (Output 50%, Behavior 30%, Leverage 20%).
- **OBS — OBLScore**: Nilai kinerja per employee per periode review, computed otomatis dari data OBL.

Wave 4 menjadi lengkap bersamaan dengan Phase 2 selesai, sehingga ketika Phase 3 dimulai, seluruh 35 objek ontology sudah aktif dan memiliki data yang cukup untuk mendukung autonomous operations.[^3]

***

### 1.3 Object Relationship Map (Cara Objek Saling Terhubung)

Ini adalah relasi kritis antar objek di Wave 1 dan Wave 2:

```
Account (holding)
  └── Customer (legal entity)
        └── Contract / PricingTier
        └── Shipment (1 customer bisa punya ribuan shipment)
              └── Leg (1 shipment bisa punya banyak leg)
              └── Package (1 shipment bisa punya banyak colly/paket)
              └── TrackingEvent (timeline kejadian per shipment)
              └── Invoice (tagihan ke customer)
                    └── Payment (penerimaan bayar)
                    └── IntercoTransaction (jika lintas entitas)

Branch
  └── BranchPL (P&L per periode)
  └── CostCenter (alokasi biaya)
  └── Manifest (armada yang bergerak dari/ke cabang)
        └── Leg (segmen perjalanan dalam manifest)

Vehicle / Driver / LocalHero / Agent / Vendor
  └── Terhubung ke Leg sebagai carrier
```

Setiap relasi ini bersifat **formal dan enforced** — sistem tidak mengizinkan Shipment tanpa Customer, tidak mengizinkan Leg tanpa Shipment, tidak mengizinkan Invoice yang tidak ter-link ke Shipment.[^1]

***

## Komponen 2 — Unified Data Ingestion Pipeline

### 2.1 Masalah yang Diselesaikan

Saat ini ABC Express punya data yang tersebar di:[^1]

- 90.726 pesan WhatsApp OPS Monitoring
- 58.387 pesan WhatsApp Sales Team
- Excel spreadsheet per cabang (format berbeda-beda)
- Platform ANTERO (43.307 shipments, 24.761 customers, 7.959 routes sudah ada)
- GPS tracker armada (tapi tidak terintegrasi)
- Finance dengan COA 150 akun
- Email operasional dan komersial

Semua ini harus masuk ke satu platform dengan **satu sumber kebenaran** per entitas.

### 2.2 Arsitektur Ingestion

**Layer 1 — Source Connectors (Pengumpul Data)**

Setiap sumber data punya connector khusus dengan mode yang berbeda:


| Sumber | Mode Ingestion | Frekuensi | Tantangan Khusus |
| :-- | :-- | :-- | :-- |
| Platform ANTERO existing | Direct DB migration + ongoing sync | Real-time | Data cleaning: duplikat customer, format tidak konsisten |
| GPS tracker armada | API pull atau webhook push | 30 detik interval | GPS sering offline di daerah 3T — sistem harus handle `last_known_position` |
| Excel cabang | Manual upload + parsing engine | Harian | Format Excel berbeda per cabang — parser harus adaptif |
| WhatsApp OPS | Export archive → NLP parsing | Batch historis | Unstructured text → harus diekstrak ke TrackingEvent yang terstruktur |
| Finance COA | Direct integration ke accounting software | Nightly batch | COA 150 akun harus di-mapping ke CostCenter ontology |
| Email komersial | Email parsing + NLP | Real-time | Ekstrak info Quote, Contract, SalesActivity dari email body |

**Layer 2 — Transformation \& Validation Engine**

Setiap data yang masuk melewati **4 checkpoint wajib** sebelum masuk ke ontology:

1. **Schema Validation** — apakah field yang wajib ada (misalnya `legalEntityId` di Shipment) terisi? Jika tidak, record masuk ke quarantine queue, bukan langsung rejected. Operator punya waktu 24 jam untuk melengkapi atau record akan di-flag sebagai incomplete.
2. **Business Rule Validation** — apakah `actualDeliveryAt` sebelum `committedDeliveryAt`? Apakah `chargeableWeight` positif? Apakah `cglSegmentId` ada di enum yang valid? Setiap violation di-log ke Audit Trail dengan timestamp dan user yang bertanggung jawab.
3. **Deduplication Check** — sebelum insert record baru, sistem cek apakah entitas dengan identifier yang sama sudah ada. Untuk Customer, identifier adalah kombinasi nama legal + NPWP. Jika ada duplikat, sistem merge dengan aturan: data yang lebih lengkap menang, dengan notifikasi ke Business Owner domain.
4. **IntercoTransaction Detector** — setiap transaksi keuangan yang melibatkan dua LegalEntity dalam grup (Antero dan Arandy) secara otomatis di-flag sebagai ICT dengan status `Pending`. Sistem tidak bisa lanjut period closing jika ada ICT yang `Pending`.[^3]

**Layer 3 — Event Bus (Jantung Real-Time)**

Event Bus adalah infrastruktur yang memungkinkan semua komponen sistem "berbicara satu sama lain" secara real-time. Cara kerjanya:

- Setiap perubahan status objek di ontology — misalnya Shipment berubah dari `InTransit` ke `Exception` — menghasilkan sebuah **event** yang dipublikasikan ke Event Bus
- Event Bus mendistribusikan event ini ke semua subscriber yang relevan: dashboard, notification engine, audit trail, dan (di Phase 2) AI agents
- Event tidak pernah hilang — setiap event di-persist dengan timestamp dan payload lengkap. Ini adalah fondasi dari **audit trail yang tidak bisa dimanipulasi**

Contoh aliran event:

```
GPS mendeteksi truk berhenti 4 jam di luar jadwal
→ Event: [VehicleUnexpectedStop] dipublikasikan ke Event Bus
→ Subscriber 1: Dashboard Fleet Twin menampilkan flag di peta
→ Subscriber 2: Audit Trail merekam kejadian
→ Subscriber 3 (Phase 2): Maintenance Agent analisis apakah ini breakdown
→ Subscriber 4 (Phase 2): Dispatch Agent cari armada cadangan jika perlu
```

**Layer 4 — Data Store Architecture**

Data disimpan dalam dua tipe storage yang melengkapi satu sama lain:

**Operational Store (PostgreSQL)** — menyimpan state objek saat ini. Ini adalah "kebenaran sekarang." Pertanyaan seperti "berapa jumlah shipment active hari ini per cabang?" dijawab dari sini dengan response time < 100ms.

**Analytical Warehouse** — menyimpan history lengkap semua event dan state perubahan. Ini adalah "memori perusahaan." Pertanyaan seperti "berapa rata-rata waktu transit Jakarta–Makassar 3 bulan terakhir, dipecah per jenis layanan?" dijawab dari sini. Analytical Warehouse diupdate setiap malam dari Operational Store + Event Bus log.[^2]

***

## Komponen 3 — Single Source of Truth: 3 Domain Inti

Phase 1 tidak mencoba membersihkan semua data sekaligus. Fokus pada **3 domain yang paling kritis** karena menjadi fondasi semua keputusan berikutnya.[^2]

### Domain 1 — Shipment Truth

**Tujuan:** setiap pengiriman yang terjadi di ABC Express memiliki satu dan hanya satu record yang menjadi kebenaran, dapat di-query kapan saja, dan memiliki lineage lengkap dari pickup sampai delivery.

**Yang harus diselesaikan:**

- Migrasi 43.307 shipments yang sudah ada di ANTERO ke ontology baru dengan schema yang bersih
- Validasi bahwa setiap Shipment ter-atribut ke satu LegalEntity (tidak ada Shipment yang "mengambang" antara Antero dan Arandy)
- Establish `chargeableWeight` calculation rule yang konsisten dan applied di semua cabang
- Build **Shipment Timeline View** — satu halaman yang menampilkan seluruh lifecycle sebuah shipment dari awal hingga akhir, dengan setiap state change tercatat: siapa yang trigger, kapan, dari mana (GPS/manual/sistem)

**Success metric:** 100% shipment baru yang masuk setelah go-live ter-track di sistem — bukan di WhatsApp.

### Domain 2 — Customer Truth

**Tujuan:** memiliki satu master record yang akurat untuk setiap customer, dengan status lifecycle yang ter-update secara otomatis berdasarkan aktivitas aktual.

**Yang harus diselesaikan:**

- Deduplication customer dari ANTERO (24.761 customer) — banyak yang kemungkinan duplikat karena di-input manual oleh cabang berbeda dengan ejaan berbeda
- Establish **Account → Customer hierarchy** yang benar. Contoh kritis: Cahaya Mas Cemerlang Group harus jadi satu Account dengan banyak Customer (PT CMC Jakarta, PT CMC Surabaya, dll.) — bukan muncul sebagai 7 Customer terpisah tanpa relasi[^3]
- Retroaktif klasifikasikan semua 24.761 customer ke CGL1, CGL2, atau CGL3 — ini pekerjaan manual yang harus dilakukan sekali, setelah itu aturan auto-classification berlaku untuk customer baru
- Aktivasi `lastShipmentDate` tracking — sistem setiap hari menghitung hari sejak transaksi terakhir per customer dan mengupdate `dormancyDays`. Ini yang jadi sinyal awal churn

**Success metric:** identifikasi dan recovery plan untuk 49 churned accounts >Rp100M dan 70 silent customers >Rp200M yang sudah teridentifikasi.[^1]

### Domain 3 — Branch Truth

**Tujuan:** setiap cabang memiliki profil yang akurat, hirarki reporting yang terdefinisi, dan P\&L yang dapat di-compute otomatis.

**Yang harus diselesaikan:**

- Klasifikasikan semua cabang ke dalam 6 profil HubRO unik dari Manifesto v4
- Definisikan `reportsToBranchId` untuk setiap cabang — hirarki konsolidasi yang memungkinkan sistem auto-roll-up dari station ke RO ke HO
- Mapping `CostCenter` per cabang ke COA 150 akun yang sudah ada di Finance — ini adalah bridge antara operational data dan financial data
- Build **Branch P\&L Computation Engine**: sistem yang setiap malam menghitung revenue, biaya, dan margin per cabang dari data yang ada di ontology, tanpa input manual dari Finance

**Success metric:** owner bisa lihat P\&L per cabang tanpa menunggu laporan — cukup buka dashboard.[^2]

***

## Komponen 4 — IntercoTransaction Elimination Engine

### 4.1 Mengapa Ini Harus Diselesaikan di Phase 1

Potensi double-counting Rp28,1 miliar bukan masalah moral atau disiplin — ini masalah arsitektur. Rantai sirkularnya adalah:[^1]

```
Sartrans (vendor catat biaya)
  → PT Antero (catat sebagai revenue)
  → JNE (catat sebagai biaya)
  → PT Arandy (catat sebagai revenue lagi)
```

Setiap entitas benar dari perspektifnya sendiri. Tapi ketika dikonsolidasikan, transaksi yang sama dihitung 2-3 kali. Ini adalah **temuan audit yang dapat menggagalkan IPO**.[^1]

### 4.2 Cara Kerja Engine

**Step 1 — Detection (Otomatis)**

Setiap transaksi keuangan yang dicatat di sistem di-scan terhadap dua kriteria:

- Apakah melibatkan dua LegalEntity dalam grup yang sama (Antero dan Arandy)?
- Apakah ada referensi ke shipment atau project yang sama di kedua sisi?

Jika ya, transaksi otomatis di-flag sebagai `IntercoTransaction` dengan status `Pending`.

**Step 2 — Matching (Semi-Otomatis)**

Engine mencoba auto-match ICT dengan pasangannya:

- ICT di Antero dengan amount X untuk shipment ID \#12345 akan di-match dengan ICT di Arandy dengan amount yang identik atau dalam toleransi 0,1% untuk shipment yang sama
- Matched ICTs masuk ke `EliminationQueue` untuk review

**Step 3 — Elimination (Enforcement)**

Finance Lead mereview `EliminationQueue` dan untuk setiap matched pair:

- Menandai kedua record sebagai `Eliminated`
- Sistem otomatis exclude kedua record dari laporan konsolidasi
- Audit trail mencatat: siapa yang approve eliminasi, kapan, referensi TP Manual section berapa

**Step 4 — Period Closing Gate (Hard Block)**

Ini adalah mekanisme paling penting: **sistem tidak mengizinkan period closing jika masih ada ICT dengan status `Pending`**. Ini bukan peringatan — ini adalah hard block. COO/CFO tidak bisa generate laporan konsolidasi bulan itu sampai semua ICT `Pending` diselesaikan. Enforcement berbasis arsitektur, bukan disiplin manusia.[^3]

***

## Komponen 5 — Branch P\&L Live Engine

### 5.1 Arsitektur Komputasi

Branch P\&L Live bukan laporan yang dibuat bulanan. Ini adalah **angka yang bergerak setiap hari**, di-compute secara inkremental dari transaksi-transaksi yang masuk.[^2]

**Revenue Recognition Layer**

Revenue per cabang di-compute dari tiga sumber:

1. **Direct Revenue:** Invoice yang ter-linked ke Shipment yang berasal dari atau dituju ke cabang tersebut, berdasarkan `branchOriginId` atau `branchDestinationId`
2. **Hub Service Revenue:** Jika cabang berfungsi sebagai Hub Transit — yaitu Shipment melewati cabang ini tanpa berasal atau berakhir di sini — cabang ini mendapat revenue sesuai Transfer Pricing Activity A1 (Hub Service Fee)
3. **Last-Mile Revenue:** Jika cabang melakukan last-mile delivery menggunakan LocalHero, revenue diatribusikan ke cabang berdasarkan TP Activity A2

**Cost Attribution Layer**

Biaya per cabang di-hitung dari CostEntry yang ter-linked ke CostCenter milik cabang tersebut. CostEntry dikategorikan ke dalam 5 bucket:

- `DirectLabor`: gaji driver, helper, kurir yang aktif di cabang
- `VehicleOpex`: fuel, maintenance, toll yang digunakan armada cabang
- `FacilityCost`: sewa gudang, listrik, operasional fisik cabang
- `VendorCost`: biaya subkontraktor yang di-dispatch dari cabang
- `OverheadAllocation`: alokasi overhead HO ke cabang berdasarkan formula yang terdefinisi di TP Manual

**Gross Margin Computation**

```
Branch Gross Margin = Revenue (Direct + Hub + LastMile) - Cost (Labor + Vehicle + Facility + Vendor + OH)
```

Angka ini di-compute setiap malam dan tersedia di dashboard pagi berikutnya. Jika ada transaksi besar yang masuk real-time (misalnya Invoice lunas untuk proyek besar), sistem trigger recomputation segera.

### 5.2 Shadow Pricing Validation

Sebelum Branch P\&L Live di-rollout penuh, sistem menjalankan **Shadow Pricing** selama minimum 6 minggu:[^4]

- Selama periode ini, sistem menghitung P\&L per cabang secara paralel dengan cara lama (Excel Finance)
- Discrepancy antara dua hasil di-flag dan dianalisis
- Setelah 6 minggu dengan discrepancy < 2%, Shadow Pricing dinyatakan valid dan Branch P\&L Live menjadi sumber kebenaran resmi

Ini mencegah situasi di mana Branch Head terkejut dengan angka yang berbeda tiba-tiba muncul di sistem baru.

***

## Komponen 6 — Action Framework (Two-Way Sync)

### 6.1 Bukan ETL Satu Arah

Sistem tradisional data warehouse bekerja satu arah: data dikumpulkan dari sistem operasional, lalu ditampilkan di laporan. Tapi laporan tidak bisa memicu tindakan kembali ke sistem operasional — harus dikerjakan manual.[^1]

Phase 1 membangun **Two-Way Sync**: setiap perubahan state di ontology dapat ter-propagate kembali ke sistem operasional. Ini adalah fondasi untuk semua automation di Phase 3.

### 6.2 Action Catalog Phase 1

Di Phase 1, Actions yang diizinkan masih **human-in-the-loop** — artinya AI atau sistem mengusulkan, manusia yang approve. Ini adalah 8 Action yang dibangun di Phase 1:


| Action | Trigger | Precondition | Effect | Authorization |
| :-- | :-- | :-- | :-- | :-- |
| `FlagShipmentException` | SLA breach terdeteksi | Shipment dalam status InTransit, committedDeliveryAt < now | Status berubah ke Exception, TrackingEvent dicatat | Sistem otomatis |
| `EliminateIntercoTransaction` | Finance Lead klik approve | ICT sudah ter-matched dengan pasangannya | Status ICT berubah ke Eliminated, excluded dari konsolidasi | Finance Lead only |
| `LockBranchPL` | Akhir periode | Semua ICT sudah Eliminated | Branch P\&L status berubah ke Locked, tidak bisa diedit | CFO/Finance Lead |
| `MarkCustomerDormant` | lastShipmentDate > threshold | Customer sebelumnya Active | Status Customer berubah ke Dormant, alert ke Account Manager | Sistem otomatis |
| `UpgradeCustomerTier` | Revenue kumulatif melewati threshold | Customer dalam CGL2 | PricingTier berubah, Account Manager dinotifikasi | Commercial Director |
| `ReconcileManifest` | Manifest tiba di destination | Manifest dalam status InTransit | Sistem hitung discrepancy fisik vs sistem, buat Incident jika ada | Branch Ops Head |
| `UpdateBranchHierarchy` | Admin request | Validation dari COO | reportsToBranchId berubah, seluruh roll-up konsolidasi berubah | COO only |
| `CreateIncidentFromException` | Exception Shipment tidak resolve dalam SLA window | Shipment dalam Exception > X jam | Incident object dibuat, severity ditentukan, assigned ke responsible party | Sistem otomatis |

Setiap Action yang dieksekusi menghasilkan **AuditTrailEntry** yang immutable: siapa, kapan, dari state apa, ke state apa, dengan reasoning apa. Ini adalah fondasi dari audit Big4 yang dibutuhkan untuk IPO.[^4]

***

## Komponen 7 — Executive War Room Dashboard v1

### 7.1 Filosofi Desain

War Room Dashboard bukan kumpulan chart. Ini adalah **panel pengambil keputusan** yang dirancang untuk menjawab satu pertanyaan utama setiap pagi:

> *"Apa yang perlu saya putuskan hari ini untuk memastikan perusahaan berjalan sesuai rencana?"*

Setiap elemen di dashboard harus actionable — bukan sekadar informasi.[^2]

### 7.2 Panel-Panel War Room v1

**Panel 1 — National Shipment Status (Real-Time)**

- Peta Indonesia dengan overlay jumlah shipment aktif per region
- Traffic light per region: hijau (on-time > 95%), kuning (85–95%), merah (< 85%)
- Counter: total shipment `InTransit`, `Exception`, `Delayed`, `Delivered` hari ini
- Top 5 rute dengan delay terbanyak hari ini — langsung visible tanpa klik
- Klik pada region membuka drill-down ke daftar shipment Exception di region tersebut

**Panel 2 — Branch P\&L Board (Monthly Running)**

- Grid per cabang dengan tiga angka: Revenue bulan berjalan, Cost bulan berjalan, Gross Margin
- Color coding: hijau (margin > target), kuning (margin 50–100% target), merah (margin < 50% target atau negatif)
- Tren 3 bulan terakhir per cabang — visual spark line di setiap sel
- Filter: tampilkan hanya cabang merah / urutkan berdasarkan margin terkecil

**Panel 3 — Customer Risk Radar**

- List customer dengan `dormancyDays` terbesar dan `lastRevenueAmount` tertinggi — ini adalah customer yang paling berisiko churn dengan dampak terbesar
- Kolom: Customer Name, CGL Segment, Days Since Last Shipment, Last 3-Month Revenue, Account Manager, Last Contact Date
- Tombol "Schedule Follow-Up" yang langsung membuat SalesActivity di sistem — bukan mengarahkan ke WhatsApp

**Panel 4 — IntercoTransaction Status**

- Count ICT dengan status Pending, Eliminated, Reviewed per period
- Alert merah jika period closing deadline < 7 hari dan masih ada ICT Pending
- Progress bar: "X dari Y ICT sudah di-eliminate bulan ini"

**Panel 5 — Aging Receivable Heatmap**

- Bubble chart: sumbu X adalah usia piutang (hari), sumbu Y adalah nilai piutang
- Warna bubble menunjukkan cabang/CGL
- Filter per legal entity (Antero vs Arandy)
- Total outstanding per bucket: Current / 1-30 / 31-60 / 61-90 / >90

**Panel 6 — Fleet Utilization Snapshot**

- Berapa % armada per cabang sedang aktif vs idle vs maintenance
- Top 5 armada dengan idle time terlama hari ini
- Fuel anomaly flag: armada yang konsumsi BBM > 2 standar deviasi dari baseline rute serupa


### 7.3 Role-Based View

War Room Dashboard menampilkan panel berbeda berdasarkan role pengguna:


| Role | Panel yang Terlihat |
| :-- | :-- |
| Founder / CEO | Semua 6 panel + IPO Readiness Score |
| COO | Panel 1, 2, 5, 6 + Operational Alerts |
| Commercial Director | Panel 3 + Pipeline View + CGL Revenue Breakdown |
| Finance Lead | Panel 4, 5 + ICT Elimination Queue + Branch P\&L Detail |
| Branch Head | Panel 1 (filtered cabangnya) + Panel 2 (cabangnya only) + Fleet Panel |


***

## Komponen 8 — Governance \& Business Owner Matrix

### 8.1 Mengapa Governance Harus Dibangun di Phase 1

Tanpa governance yang jelas, ontology akan mengalami **decay dalam 12 bulan**. Tim masing-masing mulai buat workaround, definisi objek mulai drift dari realitas, dan sistem yang dibangun susah payah menjadi sama tidak terpercayanya dengan Excel yang digantikan.[^1]

### 8.2 Business Owner per Domain

Setiap domain ontology punya satu **Business Owner** yang bertanggung jawab atas kualitas data dan berwenang approve perubahan struktural:[^3]


| Domain | Business Owner | Tanggung Jawab |
| :-- | :-- | :-- |
| Core (Shipment, Leg, Manifest) | COO / Head of Operations | Approve perubahan lifecycle states, validate tracking rule |
| Commercial (Customer, Account, Opportunity) | Commercial Director (Ibu Ema) | Approve perubahan CGL definisi, validate churn threshold |
| Financial \& Governance (Invoice, ICT, BranchPL) | Finance Lead / CFO | Approve perubahan TP rule, validate eliminasi, sign-off period closing |
| Network (Branch, LocalHero, Agent, Route) | Head of Network Development | Approve penambahan cabang, validate HubRO profil |
| People (Employee, Driver, OBL Score) | HR Lead | Approve perubahan OBL formula, validate roleCode |

Business Owner bukan IT. Mereka adalah pemilik domain bisnis. Perubahan ke ontology tidak bisa dilakukan tanpa approval Business Owner yang relevan — ini enforced di sistem sebagai `ApprovalRequired` flag di setiap perubahan schema.[^1]

### 8.3 Architecture Decision Record (ADR)

Setiap keputusan arsitektur teknis yang signifikan di-dokumentasikan sebagai **ADR** — sebuah dokumen formal yang mencatat:

- Konteks masalah yang dihadapi
- Opsi yang dipertimbangkan
- Reasoning di balik pilihan yang dibuat
- Konsekuensi yang diantisipasi

Contoh ADR yang harus dibuat di Phase 1:

- ADR-001: Mengapa PostgreSQL dipilih vs NoSQL untuk Operational Store
- ADR-002: Bagaimana cara handle Shipment yang melintasi 3 LegalEntity sekaligus
- ADR-003: Formula chargeableWeight dan edge cases yang diizinkan
- ADR-004: Threshold dormancyDays per CGL segment untuk trigger churn flag

ADR ini menjadi memory institusi — ketika ada engineer baru bergabung, atau ketika ada investor yang bertanya tentang arsitektur, jawabannya ada di sini.[^4]

***

## Timeline Eksekusi Phase 1

| Minggu | Aktivitas | Deliverable | PIC |
| :-- | :-- | :-- | :-- |
| 1–2 | Validation Kit: Paket A (Commercial) + Paket B (Finance) secara paralel | Feedback dari Commercial Director + Finance Lead | Pak Andi kirim ke Ibu Ema + Finance Lead |
| 2–3 | Validation Kit: Paket C (6 Branch Heads) + Paket D (Founder) | Feedback 6 Branch Heads + Refleksi strategis Founder | Pak Andi + Branch Heads |
| 3 | Consolidation session — semua stakeholder, 3 jam | Keputusan final untuk semua objek yang ambiguous | Pak Andi fasilitasi |
| 4 | Object Catalog v0.2 dihasilkan dengan tracked changes | Dokumen final ontology yang siap jadi acuan implementasi | Data team |
| 5–8 | Wave 1 implementation: 5 Core Objects + ingestion pipeline | Shipment Truth, Customer Truth, Branch Truth live | Tech Lead |
| 9–12 | Wave 2 implementation: Financial Objects + ICT Elimination Engine | IntercoTransaction workflow + Shadow Pricing mulai berjalan | Tech Lead + Finance |
| 13–14 | Shadow Pricing validation (paralel dengan cara lama) | Discrepancy report — target < 2% selisih | Finance Lead |
| 15–16 | War Room Dashboard v1 go-live | CEO, COO, Commercial Director bisa akses | Tech Lead |
| 17–20 | 6 minggu Shadow Pricing + refinement | Branch P\&L Live validated | Finance Lead + Branch Heads |
| 20 | Phase 1 completion gate | 100% shipment baru ter-track, Branch P\&L live, ICT engine active | Pak Andi |


***

## Success Criteria Phase 1 — Definition of Done

Phase 1 dinyatakan selesai jika dan hanya jika **semua 6 kriteria berikut terpenuhi**:[^4][^2]

1. **Shipment Truth live** — 100% shipment baru yang masuk setelah go-live ter-track di sistem, bukan di WhatsApp. Zero shipment yang lifecycle-nya tidak terdokumentasi di ontology
2. **Customer Truth validated** — semua 24.761 customer sudah ter-deduplicate dan ter-klasifikasi ke CGL. Dormancy tracking aktif untuk semua customer
3. **Branch P\&L live** — owner bisa lihat P\&L per cabang hari ini tanpa menunggu laporan Finance. Shadow Pricing validation sudah passed dengan discrepancy < 2%
4. **ICT Elimination Engine active** — tidak ada period closing yang bisa dilakukan dengan ICT Pending. Potensi double-counting Rp28,1 miliar ter-resolve secara struktural
5. **War Room Dashboard v1 operational** — CEO, COO, Commercial Director, Finance Lead masing-masing bisa akses dashboard dengan view sesuai role-nya
6. **Governance established** — Business Owner matrix terdefinisi, ADR-001 s/d ADR-004 terdokumentasi, perubahan ontology tidak bisa dilakukan tanpa approval Business Owner

Jika Phase 1 selesai, ABC Express bukan lagi perusahaan yang "punya banyak data tapi tidak bisa menjawab pertanyaan sederhana." ABC Express menjadi perusahaan yang **memahami dirinya sendiri**  — dan baru dari sinilah AI Agents di Phase 2 bisa masuk dan benar-benar berguna.[^1]

<div align="center">⁂</div>

[^1]: Memahami_Ontology_Foundational_Reading_C-Level_ABC_Express-2.pdf

[^2]: SESSION-3.txt

[^3]: Validation_Kit_v0.1_ABC_Express-4.pdf

[^4]: Kajian_Strategis_DSV_untuk_ABC_Express_v1_0.pdf

