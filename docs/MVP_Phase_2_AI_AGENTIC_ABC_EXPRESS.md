<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Oke, selanjutnya revisi saja  MVP Phase 2 AI AGENTIC ABC EXPRESS yang sudah dibuat, agar tambahkan konsep memory agentic memakai implementasi referensi arsitektur memory dari Hermes Agent.

Baik, saya baca full dokumen Phase 2. Sekarang saya akan menulis revisi komprehensif yang mengintegrasikan arsitektur memory Hermes ke seluruh sistem — bukan hanya menambahkan section baru, tapi meng-embed konsep memory ke setiap agent secara native.

***

# MVP Phase 2 — AI Agentic ABC Express *(Revised)*

## *Operating AI Year: AI Masuk Setelah Fondasi Bersih*

### *Target: Q4 2026–Q2 2027 | "AI bukan chatbot — AI adalah decision engine yang tidak pernah lupa"*


***

## Prasyarat Mutlak Sebelum Phase 2 Dimulai

Phase 2 **tidak boleh dimulai** jika Phase 1 belum melewati semua 6 success criteria-nya. AI Agent yang bekerja di atas data yang masih kotor akan menghasilkan rekomendasi yang salah — dan rekomendasi salah dari sistem AI justru lebih berbahaya dari tidak ada sistem sama sekali, karena orang cenderung percaya pada output yang terlihat "sistematis."[^1]

Checklist yang harus hijau sebelum Phase 2 deploy:

- ✅ Shipment Truth: 100% shipment baru masuk via ontology, bukan WhatsApp
- ✅ Customer Truth: 24.761 customer sudah ter-deduplicate + CGL classified
- ✅ Branch P\&L Live: Shadow Pricing validation passed, discrepancy < 2%
- ✅ ICT Elimination Engine: hard block period closing aktif, zero ICT Pending
- ✅ Event Bus aktif: setiap state change menghasilkan persisted event
- ✅ War Room Dashboard v1: semua role-based view sudah operational

**Hanya setelah semua ini hijau, Phase 2 boleh mulai**.[^1]

***

## Filosofi Phase 2: Apa yang Dimaksud "AI Agentic"

**AI Agent bukan:**

- Chatbot yang menjawab pertanyaan ketika ditanya
- Dashboard yang menampilkan angka lebih canggih
- Laporan otomatis yang dikirim via email

**AI Agent adalah:**

- Entitas perangkat lunak yang punya **domain fokus** tertentu
- Memiliki akses **read + action** ke ontology layer
- Bekerja secara **proaktif** — tidak menunggu ditanya, tapi terus-menerus memantau
- Menghasilkan **rekomendasi yang grounded** — setiap klaim bisa di-trace ke data spesifik
- Beroperasi dalam **human-in-the-loop model** di Phase 2 — AI mengusulkan, manusia memutuskan
- **Tidak amnesia** — setiap sesi baru, agent ingat pattern, preferensi, dan history dari sesi-sesi sebelumnya
- Setiap tindakan meninggalkan **audit trail yang immutable**

Tambahan kritis yang membedakan Phase 2 dengan implementasi AI biasa: setiap agent memiliki **arsitektur memory 4-layer** yang membuatnya semakin cerdas seiring waktu, bukan sekadar tool yang pintar hari ini tapi lupa besok.[^2]

***

## Memory Architecture: Hermes-Inspired 4-Layer System

Ini adalah fondasi teknikal terpenting Phase 2. Sebelum membahas masing-masing agent, seluruh tim teknikal harus memahami arsitektur memory ini karena ia memengaruhi **setiap keputusan implementasi** yang akan dibuat.

### Mengapa Memory Architecture Menentukan Segalanya

Tanpa memory architecture yang benar, setiap agent di ABC Express akan mengalami **complete amnesia** di setiap sesi baru — tidak ada bedanya dengan general-purpose LLM yang dipanggil secara random. Agent seperti itu tidak punya nilai jangka panjang.[^1]

Dengan arsitektur memory yang benar terinspirasi dari Hermes Agent (Nous Research), agent di ABC Express akan berperilaku seperti **COO senior yang terus belajar** — setiap hari makin kenal dengan bisnis, makin paham pattern musiman, makin tahu preferensi CEO, makin akurat dalam prediksi. Ini adalah compounding intelligence yang tidak bisa dibeli dengan tool manapun.[^2]

### Layer 1 — Semantic Memory (Static Knowledge Base)

Semantic memory adalah **pengetahuan foundational** yang diberikan ke agent saat pertama kali di-setup. Ia di-compile oleh `prompt_builder` setiap kali agent startup dan tidak berubah selama satu sesi berjalan (*prompt stability*).

Semantic memory terdiri dari empat file yang masing-masing punya peran berbeda:

**SOUL.md — Agent Persona \& Business Context**

Ini adalah "kepribadian dan prinsip" agent — bukan kosmetik, tapi constraint operasional yang menentukan bagaimana agent boleh berpikir dan bertindak:

```
Contoh SOUL.md untuk COO Agent:
- Kamu adalah Chief Operating Intelligence ABC Express.
- Kamu tidak berspekulasi. Setiap klaim harus punya data source 
  dari ontology yang bisa di-cite.
- Kamu TIDAK memutuskan — kamu menyajikan maksimum 3 opsi dengan 
  trade-off yang jelas.
- Kamu tidak pernah menghasilkan alert tanpa evidence. 
  Jika data tidak cukup, katakan "data tidak cukup."
- Output kamu selalu JSON structured — tidak boleh narasi bebas 
  yang tidak bisa di-parse sistem.
- Selalu sertakan confidence level (0–100) untuk setiap rekomendasi.
```

**MEMORY.md — Agent's Own Accumulated Domain Insights**

Ini adalah file yang **agent sendiri yang menulis** — bukan manusia yang setup. Setiap kali agent menemukan pattern baru yang signifikan (muncul lebih dari sekali, ter-konfirmasi dengan outcome), agent menulis ke MEMORY.md-nya sendiri via `memory` tool. File ini kemudian otomatis masuk ke system prompt di sesi berikutnya.

```
Contoh MEMORY.md yang diisi COO Agent setelah 2 bulan operasi:
- [2026-12-03] Makassar SLA selalu degradasi di minggu ke-3 bulan 
  karena jadwal ferry PELNI. Jangan flag sebagai anomali operasional.
- [2026-11-15] CEO preferensi: briefing max 10 items, tidak suka 
  angka persentase tanpa absolut value di sebelahnya.
- [2026-11-08] Vendor PT Mitra Abadi reliability turun drastis sejak 
  ganti armada — watch closely, belum terkonfirmasi sebab.
- [2026-10-22] Revenue CGL3 (Pos) selalu turun 20–30% di Ramadan 
  — seasonal, bukan churn signal.
```

Kunci: MEMORY.md adalah **institutional knowledge yang berkembang organik** — bukan diisi manual oleh tim IT, tapi tumbuh dari pengalaman agent itu sendiri. Inilah yang membuat agent makin cerdas seiring waktu.

**USER.md — Stakeholder Profile**

Profile orang-orang yang berinteraksi dengan agent: preferensi format, threshold yang penting bagi mereka, pola persetujuan, dan konteks historis relasi mereka dengan sistem.

```
Contoh USER.md untuk COO Agent (profile CEO):
- Pak Andi membuka briefing rata-rata pukul 07:15 WIB.
- Biasanya langsung ke item Critical tanpa membaca Info.
- Accept rate untuk rekomendasi operational: 72%.
- Sering override untuk hal yang menyangkut cabang Makassar 
  — kemungkinan ada konteks relasional yang tidak ada di data.
- Tidak suka notifikasi berulang untuk isu yang sama 
  dalam 24 jam tanpa perkembangan baru.
```

**Skills \& Context Files — Domain Rules**

Berisi aturan bisnis ABC Express yang terdefinisi formal: SOP operasional, formula Transfer Pricing dari TP Manual v1.0, threshold SLA per rute per service type, PricingRule catalog, struktur hirarki Branch, dan definisi semua CGL Segment. Konten ini hanya berubah ketika Business Owner melakukan perubahan formal ke ontology — enforcement berbasis arsitektur, bukan disiplin manusia.[^3]

### Layer 2 — Episodic Memory (Session History via SQLite + FTS5)

Episodic memory adalah **rekaman lengkap semua yang pernah terjadi dalam sesi agent** — setiap percakapan, setiap tool call, setiap hasil tool, dan yang paling kritis: **setiap reasoning chain**.

Disimpan di SQLite dengan Full-Text Search (FTS5) enabled. Struktur penyimpanan setiap turn:

```
Turn Record:
{
  session_id: "coo_agent_20261103_0530",
  parent_session_id: "coo_agent_20261102_0530",
  turn_index: 4,
  role: "assistant",
  content: "...",
  reasoning: "...",    ← Chain-of-thought LLM tersimpan terpisah
  tool_calls: [...],
  outcome_feedback: null,  ← Diisi belakangan saat hasil diketahui
  timestamp: "2026-11-03T05:42:11Z"
}
```

Yang paling penting adalah field `reasoning` — **chain-of-thought disimpan**, bukan hanya outputnya. Ini yang memungkinkan audit trail penuh: investor atau auditor bisa tanya "mengapa agent merekomendasikan X?" dan sistem bisa trace sampai ke langkah berpikir detail.

**Session Lineage:** setiap sesi punya `parent_session_id` yang merujuk ke sesi sebelumnya. Ketika context compression terjadi, sesi baru ("child") dibuat dengan reference ke sesi lama ("parent"). History tidak pernah benar-benar hilang — hanya di-compress dan tetap bisa di-query via FTS5 menggunakan `session_search` tool.

```
Query via session_search:
"semua kali agent merekomendasikan reroute via Balikpapan"
→ FTS5 search across seluruh episode history
→ Returns: 7 relevant turns dengan context dan outcomes
→ Agent bisa lihat: 5 dari 7 menghasilkan outcome positif
```


### Layer 3 — External Memory Provider (Cross-Session Persistent Knowledge)

Ini adalah lapisan paling powerful dan extensible. Diimplementasikan sebagai plugin dengan **lifecycle hooks** yang menentukan kapan dan bagaimana memory di-read dan di-write.

**Urutan Lifecycle Hooks Per Turn (Sangat Kritis untuk Dipahami):**

```
Agent Startup:
  initialize(session_id, abc_home)
    → Koneksi ke backend (vector store, ontology API)
    → Load last-session summary
  get_tool_schemas()
    → Inject memory-specific tools ke agent's tool registry
  system_prompt_block()
    → Inject persistent context ke system prompt
    (domain patterns, entity risk registry, seasonal calendar)

Sebelum Setiap API Call ke LLM:
  prefetch(query)
    → Pull context relevan dari external store
    → Masuk ke context window SEBELUM LLM mulai berpikir
    → Ini yang membuat agent "tahu" kondisi terkini tanpa diberi tahu

Setelah Setiap API Call:
  queue_prefetch(query)
    → Pre-warm context untuk turn berikutnya (async, non-blocking)
  sync_turn(user_msg, assistant_msg)
    → Persist conversation ke backend
    → ⚠️ WAJIB daemon thread — TIDAK BOLEH blocking main thread
    → Jika backend latency tinggi, agent tetap jalan tanpa menunggu

Sebelum Context Compression:
  on_pre_compress(messages)
    → ⭐ PALING KRITIS
    → Ini satu-satunya kesempatan sebelum middle turns di-discard
    → Extract dan persist semua insights sebelum hilang
    → Dibahas detail di bagian tersendiri di bawah

Akhir Sesi:
  on_session_end(messages)
    → Final extraction, flush semua pending data
  shutdown()
    → Cleanup connections, close backends

Special Event:
  on_memory_write(action, target, content)
    → Mirror setiap kali agent menulis ke MEMORY.md/USER.md
    → Trigger cross-agent notification jika relevan untuk agent lain
```

**Threading Contract yang Wajib Dipatuhi:**

`sync_turn()` adalah operasi yang **harus berjalan di daemon thread** — tidak boleh memblokir main agent thread. Alasannya: jika memory backend (vector store API, ontology write) mengalami latency tinggi, agent ABC Express tidak boleh hang menunggu memory sync selesai sebelum melanjutkan reasoning. Agent harus tetap responsif.

Implikasi untuk ABC Express: jika memory sync gagal (jaringan putus, backend down), error di-log ke **Retry Queue** dengan full payload dan exponential backoff retry (1s → 2s → 4s → 8s, max 5 retries). Jika semua retry gagal, alert ke System Admin. Agent tetap jalan dengan degraded memory — tidak crash.

**Single Provider Rule:**

Hanya **satu** external memory provider yang boleh aktif per agent dalam satu waktu. Ini mencegah tool schema bloat dan conflict antar backend. Jika di masa depan ABC Express ingin mengganti vector store provider, proses migrationnya adalah: deploy provider baru → migrate data → cutover → decommission lama. Tidak ada dual-provider yang aktif bersamaan.

### Layer 4 — Working Memory (Active Context Window)

Ini adalah context window yang aktif selama satu conversation loop — berisi percakapan saat ini, tool call results, dan reasoning yang sedang berlangsung.

**Compression Triggers — Kapan Context Di-compress:**

Hermes menggunakan dua trigger:

- **Preflight (50%):** sebelum API call ke LLM, jika conversation sudah > 50% context window → trigger compression
- **Gateway Auto-Compression (85%):** lebih agresif, berjalan di antara turns tanpa perlu API call

Untuk ABC Express, threshold ini bisa disesuaikan per agent:

- COO Agent: trigger lebih agresif (40%) karena briefing harian tidak butuh conversation history panjang
- Revenue Leak Agent: trigger lebih konservatif (65%) karena analisis pattern butuh lebih banyak konteks

**Compression Algorithm — Tidak Ada Data yang Hilang:**

```
Step 1: Memory flush ke disk terlebih dahulu
         (semua turns tersimpan sebelum apapun di-discard)
Step 2: on_pre_compress() hooks dipanggil ke semua memory providers
         (extract insights SEBELUM turns hilang)
Step 3: Middle turns di-summarize menjadi compact summary
Step 4: Last N messages dilindungi intact (default: 20 messages)
Step 5: Tool call + result pairs SELALU dijaga bersama
         (tidak pernah dipisah — tool call tanpa result = invalid)
Step 6: Session child baru dibuat dengan parent_session_id reference
```

Hasil: agent bisa berjalan **tanpa batas durasi** tanpa kehilangan konteks penting — karena semua insights sudah di-extract ke external memory sebelum turns di-compress.

### on_pre_compress — Intelligence Extraction (Komponen Paling Kritis)

`on_pre_compress()` adalah hook yang dipanggil tepat sebelum middle turns di-discard saat compression. Di ABC Express, ini adalah **mekanisme utama akumulasi institutional knowledge** — karena ini adalah satu-satunya moment agent bisa "menyelamatkan" insights dari conversation yang akan hilang.

Enam jenis intelligence yang di-extract saat on_pre_compress berjalan:


| Intelligence Type | Disimpan Ke | Retention | Deskripsi |
| :-- | :-- | :-- | :-- |
| Approved decisions + reasoning | Decision Archive (immutable) | Permanent | Setiap keputusan yang di-approve CEO/COO, beserta evidence data dan reasoning chain |
| Pattern findings | Pattern Store (versioned) | 12 bulan | Pola rute, vendor, customer yang ditemukan dan ter-konfirmasi |
| Human override log | Override Training Store | Permanent | Kapanpun manusia override rekomendasi agent — ini adalah training signal terkuat |
| Anomaly confirmations | Anomaly Calibration Store | 6 bulan | Anomali yang benar-benar masalah vs false positive — untuk kalibrasi threshold |
| Agent reasoning quality | Performance Metrics Store | 3 bulan | Berapa sering agent benar, berapa sering salah, di domain mana |
| Cross-agent relevance | Shared Context Store | Permanent | Temuan yang relevan untuk agent lain — dipublikasikan via append-only event log |

Tanpa on_pre_compress yang di-implementasi dengan benar, semua insights dalam conversation yang panjang akan **hilang saat compression** dan agent harus menemukan pattern yang sama dari nol di sesi berikutnya. Ini adalah perbedaan antara agent yang belajar vs agent yang statis.

### Prompt Assembly Architecture

`prompt_builder` mengassemble system prompt dari semua layer setiap kali agent dipanggil:

```
Final System Prompt =
  SOUL.md (persona + constraints)
  + MEMORY.md (agent's accumulated insights)
  + USER.md (stakeholder profile)
  + Active Skills content (domain rules, SLA thresholds, TP Manual)
  + Context files (network structure, branch hierarchy)
  + Tool-use guidance
  + Model-specific instructions
  + [External Memory Provider: system_prompt_block()]
    (domain pattern registry, seasonal calendar, entity risk flags)
  + [External Memory Provider: prefetch() result]
    (real-time context yang di-pull sebelum LLM dipanggil)

  ← Ephemeral injections (per-call, tidak memodifikasi file permanen):
  + Budget warnings ("context window 72% used")
  + Context pressure signals
  + Prompt caching markers
```

**Prompt Stability Principle:** Bagian dari `SOUL.md`, `MEMORY.md`, dan `USER.md` tidak berubah selama satu sesi berjalan. Perubahan ke MEMORY.md yang dibuat agent dalam sesi ini baru aktif di **sesi berikutnya** — bukan di tengah sesi. Ini mencegah context window yang "kotor" karena mutasi yang tidak terduga di tengah analisis.

### Profile Isolation — Satu Directory Per Agent

Setiap agent memiliki **isolated profile** dengan semua memory, config, dan sessions terpisah penuh:

```
~/.abcexpress_agents/
├── coo_agent/
│   ├── SOUL.md           → Persona COO Agent + business constraints
│   ├── MEMORY.md         → Accumulated domain insights (auto-written)
│   ├── USER.md           → CEO + COO profile, approval patterns
│   ├── sessions.db       → SQLite episodic memory (FTS5 enabled)
│   ├── external_memory/  → Vector store untuk semantic similarity search
│   └── todo.json         → Task state lokal agent (sesi-persistent)
├── churn_agent/
│   ├── SOUL.md
│   ├── MEMORY.md         → Churn patterns per CGL, seasonal adjustments
│   ├── USER.md           → Commercial Director profile
│   ├── sessions.db
│   └── external_memory/
├── leak_agent/
├── dispatch_agent/
├── branch_ceo_agent/
└── shared_context_store/
    ├── events.log        → Append-only cross-agent event log (immutable)
    ├── entity_registry/  → Vendor, customer, route risk flags dari semua agent
    └── decision_archive/ → Semua decisions yang di-approve (immutable)
```

**Kenapa Isolasi Penting:** COO Agent tidak boleh "terkontaminasi" oleh memory churn-specific yang hanya relevan untuk Churn Agent. Dispatch Agent tidak perlu tahu detail analisis keuangan ICT yang hanya relevan untuk Revenue Leak Agent. Isolasi ini juga memungkinkan setiap agent di-deploy, di-upgrade, atau di-rollback secara independen tanpa memengaruhi agent lain.[^2]

***

## Agent Runtime Environment (Revised)

### Memory-Enabled Agent Architecture

Setiap agent berjalan sebagai **proses independen** dengan 4-layer memory yang sudah dijelaskan di atas. Yang berubah dari deskripsi sebelumnya adalah: memory bukan lagi tiga tipe pasif yang "ada di sana" — memory adalah **komponen aktif** yang di-manage oleh lifecycle hooks yang berjalan setiap turn.

**Tool Access (Expanded dengan Memory Tools)**

Selain tool ontology yang sudah ada di versi sebelumnya, setiap agent sekarang punya **4 memory-specific tools** yang di-intercept langsung oleh Agent Runtime sebelum mencapai tool registry biasa:


| Tool | Fungsi | Kenapa Di-Intercept |
| :-- | :-- | :-- |
| `memory` | Tulis ke MEMORY.md atau USER.md | Ada character limit, langsung modifikasi agent state yang aktif |
| `session_search` | Query FTS5 SQLite episodic history | Akses ke seluruh episode history dengan full-text search lintas sesi |
| `todo` | Baca/tulis task state lokal | State yang persist selama satu sesi — untuk multi-step analysis tracking |
| `delegate_task` | Spawn subagent dengan isolated context | Subagent dapat independent iteration budget (max 50), parent budget tidak di-share |

**Kapan agent menggunakan `memory` tool:**

- Pattern terdeteksi untuk pertama kali → log ke MEMORY.md sebagai "unconfirmed pattern"
- Pattern muncul untuk kedua kali dengan konfirmasi → upgrade ke "confirmed pattern" di MEMORY.md
- Pattern terbukti false positive → hapus atau tandai "invalidated" di MEMORY.md

**Kapan agent menggunakan `delegate_task`:**

- COO Agent butuh analisis mendalam untuk satu cabang tertentu → spawn Branch Analysis Subagent dengan context terbatas pada cabang tersebut
- Revenue Leak Agent butuh investigasi detail satu vendor → spawn Vendor Investigation Subagent
- Subagent bekerja dengan 50 iteration budget terpisah, melaporkan hasilnya ke parent agent

**Reasoning Engine**

Reasoning Engine tetap menggunakan LLM sebagai core, tapi sekarang context yang dikirim ke LLM sudah di-enrich oleh prefetch() — sehingga LLM tidak hanya berpikir berdasarkan prompt, tapi berdasarkan **data aktual yang baru di-pull dari ontology sesaat sebelum reasoning dimulai**.[^2]

Reasoning content (`<think>` blocks dari model yang support extended thinking) disimpan terpisah di field `reasoning` di SQLite — tidak hilang saat compression karena di-extract oleh on_pre_compress sebelum turns di-discard.

### Agent Orchestrator

Agent Orchestrator tetap mengelola dua mode (Scheduled dan Event-Triggered), tapi sekarang juga mengelola **Memory Coordination**:

- Sebelum spawn agent, Orchestrator memeriksa apakah agent memiliki sesi yang masih "warm" (baru berjalan < 2 jam) — jika ya, resume sesi yang sama daripada membuat sesi baru, mempertahankan working memory yang masih relevan
- Setelah agent selesai, Orchestrator memastikan `on_session_end()` sudah berjalan sebelum proses di-terminate
- Orchestrator memantau Shared Context Store setiap 5 menit — jika ada event baru yang relevan untuk agent yang sedang idle, Orchestrator bisa trigger event-based wake-up dengan context event tersebut sebagai input pertama

***

## Agent 1 — COO Agent

### Peran dan Tanggung Jawab

COO Agent adalah **morning intelligence briefing system** untuk owner dan COO — agent pertama yang dibangun karena impact-nya paling langsung terasa tanpa mengubah cara kerja tim lapangan.[^1]

Pertanyaan utama:
> *"Dari semua yang terjadi di perusahaan saat ini, apa yang paling perlu saya perhatikan hari ini, mengapa, dan apa opsi tindakan saya?"*

### Memory Profile — COO Agent

**SOUL.md (Persona):**
COO Agent di-define sebagai analytic intelligence yang tidak berspekulasi, tidak pernah alert tanpa evidence, selalu menyajikan opsi bukan keputusan, dan output selalu dalam JSON structured dengan confidence level. Tidak boleh output lebih dari 15 items dalam satu briefing — enforced sebagai constraint di SOUL.md.

**MEMORY.md (Accumulated Insights — Tumbuh Organik):**

Di bulan pertama, MEMORY.md masih kosong. Agent mulai menulis ke sini setelah menemukan pattern yang ter-konfirmasi. Contoh entries yang mungkin ada setelah 3 bulan operasi:

```markdown
## Confirmed Patterns
- [2026-12-10] Ferry Makassar delay konsisten minggu ke-3 setiap bulan.
  Root cause: jadwal PELNI berubah. Bukan anomali operasional.
- [2026-11-28] CGL3 revenue drop 20-30% di Ramadan (historical 3 tahun).
  Seasonal — jangan alert sebagai churn signal ke Commercial Director.
- [2026-11-15] Vendor Maju Jaya SBY-BPN reliability turun sejak ganti armada.
  Perlu diwatch — belum cukup data untuk konfirmasi permanent.

## CEO Preferences (from USER.md interaction patterns)
- Briefing > 10 items selalu di-skip bagian bawah. Enforce strict top-10.
- Angka persentase tanpa absolut value langsung di-dismiss.
- Override sering terjadi untuk hal Makassar — ada konteks relasional.

## Invalidated Patterns
- [2026-12-01] Sempat flag idle fleet Surabaya sebagai anomali.
  Ternyata libur nasional regional. Jangan flag di tanggal merah.
```

**USER.md (CEO Profile):**
Berisi waktu biasanya membuka dashboard, acceptance rate per category, pattern override, topik yang sering ditindaklanjuti vs di-dismiss, dan preferensi format.

**prefetch() — Sebelum Setiap LLM Call:**

Setiap pukul 05:00 WIB saat COO Agent mulai berjalan, sebelum LLM dipanggil, prefetch() menarik konteks terkini dari ontology:

```
prefetch("kondisi operasional hari ini"):
→ Top 10 Shipment at-risk SLA (dari Operational Store, <5 menit lalu)
→ Branch P&L delta vs target (dari Analytical Warehouse, nightly update)
→ ICT Pending count + days to period closing deadline
→ Incident terbuka > 24 jam, sorted by severity
→ Customer dengan dormancyDays change > 10 dalam 24 jam terakhir
→ Manifest yang terlambat > 4 jam dari jadwal
→ Events dari Shared Context Store 24 jam terakhir
   (temuan dari Leak Agent, Churn Agent, Branch Agent)
→ Semua data ini masuk context window SEBELUM LLM mulai reasoning
```

LLM tidak "menebak" kondisi perusahaan — LLM **berpikir dengan data aktual** yang baru di-pull sesaat sebelum analysis dimulai.[^2]

**sync_turn() — Non-Blocking Persistence:**

Setelah setiap turn dalam briefing session, daemon thread menyimpan:

- Full conversation turn ke SQLite episodic memory
- Tool call + result pairs (selalu bersama, tidak pernah dipisah)
- Reasoning chain (`reasoning` field) — ini yang jadi audit trail

**on_pre_compress() — Intelligence Extraction:**

Ketika sesi mendekati 50% context window, sebelum middle turns di-compress:

1. Extract semua item yang di-accept CEO → simpan ke Decision Archive (immutable)
2. Extract pattern baru yang ditemukan → update Pattern Store
3. Extract semua override manual → simpan ke Override Training Store
4. Publish cross-agent events ke Shared Context Store
5. Update USER.md dengan preference signals baru yang terdeteksi hari ini

### Cara Kerja Internal

*(Semua 5 step dari versi sebelumnya tetap — Step 1 Data Collection, Step 2 Anomaly Scoring, Step 3 Root Cause Analysis, Step 4 Option Generation, Step 5 Briefing Compilation — dengan enhancement bahwa semua step ini sekarang menggunakan prefetch() context yang sudah di-load, bukan query real-time setiap langkah)*

Satu hal baru yang penting: **Priority Index sekarang memory-adjusted**. Jika item yang hendak di-flag adalah pattern yang sudah ada di MEMORY.md sebagai "seasonal/normal," Priority Index-nya otomatis di-reduce:

```
AdjustedPriorityIndex = BasePriorityIndex × SeasonalAdjustmentFactor
(dimana SeasonalAdjustmentFactor = 0.3 untuk pattern confirmed seasonal di MEMORY.md)
```

Ini mencegah agent melakukan alert berulang untuk hal-hal yang sudah diketahui seasonal — mengurangi alert fatigue CEO.[^1]

### Human Interface

*(Sama dengan versi sebelumnya: Accept, Dismiss, Investigate Further, Reassign — semua dengan AuditTrail)*

Tambahan baru: tombol **"Add to Agent Memory"** — ketika CEO men-dismiss item dengan reasoning tertentu, CEO bisa klik ini untuk menginstruksikan agent agar pattern ini di-save ke MEMORY.md sebagai "tidak perlu di-alert lagi jika kondisi sama." Ini adalah **direktif memory eksplisit dari manusia** — cara tercepat untuk mengajarkan agent tentang konteks bisnis yang tidak ada di data.

***

## Agent 2 — Churn Detection Agent

### Peran dan Tanggung Jawab

Churn Detection Agent adalah sistem pengawasan komersial yang bekerja 24/7 memantau tanda-tanda customer yang mulai menjauh. ROI paling cepat: satu customer Rp500 juta/tahun yang retained setara menyelamatkan margin itu sepenuhnya.[^1]

Konteks Phase 1: 49 churned accounts >Rp100M dan 70 silent customers >Rp200M sudah teridentifikasi — total risiko >Rp30 miliar/tahun.[^2]

### Memory Profile — Churn Detection Agent

**SOUL.md:**
Agent ini di-define sebagai commercial intelligence yang sensitif terhadap sinyal lemah, tidak pernah alert "churn" tanpa minimum 2 sinyal dari layer berbeda, selalu menyertakan revenue-at-risk dalam setiap alert, dan mengerti perbedaan antara churn aktual vs seasonal vs operasional.

**MEMORY.md (Accumulated Churn Intelligence):**

```markdown
## CGL-Specific Churn Thresholds (Calibrated)
- CGL1 (Institutional): alert jika dormancyDays > 45 (siklus proyek panjang)
- CGL2 (B2B Recurring): alert jika dormancyDays > 21
- CGL3 (Alliance/Pos): alert jika dormancyDays > 14

## Confirmed Seasonal Suppressions
- CGL3 volume turun 20-30% di Ramadan — bukan churn signal
- CGL1 institutional sering silent di Q1 (anggaran belum cair) — tunggu sampai day 60
- Volume PT Cemerlang selalu turun bulan Desember (internal audit mereka)

## Win-Back Intelligence
- Discount 5% + personal visit: success rate 3/5 untuk dormant CGL2
- CGL1 win-back butuh level COO contact, bukan sales biasa
- Competitor JNE sering masuk lewat rute baru — cek LaneDiversification signal

## Churn Score Calibration History
- Model bobot awal: Behavioral 35%, Financial 20%, Commercial 25%, Ops 20%
- Setelah kalibrasi bulan ke-3: Behavioral 40%, Commercial 30%, Ops 20%, Financial 10%
  (Financial signals ternyata lagging indicator — kurangi bobotnya)
```

**prefetch() — Sebelum Setiap Analysis Run:**

```
prefetch("customer risk signals last 48 hours"):
→ Semua customer dengan ChurnRiskScore berubah > 15 poin dalam 48 jam
→ SalesActivity terakhir per customer yang masuk watchlist
→ Competitive intelligence terbaru dari Competitor objects
→ Outcome dari churn alerts yang sudah pernah di-act
   (feedback loop: apakah alert sebelumnya akurat?)
→ Events dari Shared Context Store tentang customer (dari branch agent, COO agent)
→ Seasonal calendar dari MEMORY.md
   (apakah sekarang periode Ramadan, Q1 budget freeze, dll.)
```

**sync_turn() + on_pre_compress() — Learning Loop:**

Setiap minggu ketika agent beroperasi:

- `sync_turn()` menyimpan: ChurnRiskScore time-series per customer, alert yang di-acknowledge vs di-dismiss oleh sales, action yang diambil
- `on_pre_compress()` mengextract: konfirmasi churn yang benar-benar terjadi, false positives, pattern seasonal baru, dan melakukan kalibrasi bobot ChurnRiskScore

**Kalibrasi Bobot yang Otomatis:**

Setelah 3 bulan data terkumpul di episodic memory, agent menjalankan **retrospective analysis** setiap bulan: dari semua alert yang di-generate, berapa % yang berakhir jadi churn aktual per layer sinyal? Layer yang paling predictive mendapat bobot lebih tinggi. Ini bukan machine learning training — ini adalah **lookup-based calibration** dari accumulated episodic memory.

### Model Deteksi Multi-Layer

*(4 layer dari versi sebelumnya tetap: Behavioral, Financial, Commercial, Operational — dengan tambahan bahwa setiap threshold sekarang di-override oleh seasonal patterns dari MEMORY.md)*

**ChurnRiskScore Formula (Memory-Adjusted):**

```
ChurnRiskScore = 
  (BehavioralScore × MEMORY.behavioralWeight) + 
  (FinancialScore  × MEMORY.financialWeight)  + 
  (CommercialScore × MEMORY.commercialWeight) + 
  (OperationalScore × MEMORY.opsWeight)

// Bobot di-load dari MEMORY.md, bukan hardcoded
// Berubah setiap bulan berdasarkan retrospective calibration

SeasonalAdjustmentFactor = MEMORY.getSeasonalFactor(customer, currentDate)
FinalScore = ChurnRiskScore × SeasonalAdjustmentFactor
```


### Alert Tiers, Response Protocol, dan Recovery Mode

*(Sama dengan versi sebelumnya — 5 tier dari Critical 80+ hingga Healthy < 20, Response Protocol, Win-Back Analysis untuk 49 churned accounts)*

Tambahan baru: setiap Churn Brief sekarang menyertakan **Memory Context Block**:

```
CHURN BRIEF — PT Cahaya Mas Cemerlang Jakarta
ChurnRiskScore: 74 → HIGH (naik dari 51 minggu lalu)

📊 3 SINYAL UTAMA:
  1. ShipmentVelocityDrop: -42% vs 90-day avg [Behavioral]
  2. SalesActivityGap: 18 hari tanpa kontak [Commercial]
  3. LaneDiversification: mulai pakai rute SBY-MKS (baru) [Behavioral]

💡 MEMORY CONTEXT (dari Agent Episodic Memory):
  - Customer ini pernah masuk dormant Okt 2026, recovered setelah 
    personal visit dari Commercial Director. [dari Session #2847]
  - Competitor JNE masuk lewat rute baru adalah pola yang sama 
    seperti yang terjadi pada PT Anugrah sebelum churn Agt 2026.
  - Tidak ada seasonal pattern yang menjelaskan penurunan ini.

💰 REVENUE AT-RISK: Rp 847 juta (12-bulan trailing)
```

"Memory Context Block" adalah hal yang hanya bisa dihasilkan oleh agent yang punya episodic memory — ini yang membedakan dari alert system biasa.

***

## Agent 3 — Revenue Leak Agent

### Peran dan Tanggung Jawab

Revenue Leak Agent memantau kebocoran margin dari dalam — inefficiency, manipulasi, dan anomali yang menggerus profitabilitas tanpa disadari.[^1]

### Memory Profile — Revenue Leak Agent

**SOUL.md:**
Agent ini di-define sebagai financial intelligence yang sangat konservatif dalam klasifikasi fraud — tidak pernah menggunakan kata "fraud" tanpa minimum 3 sinyal yang berkorelasi, selalu membedakan antara manipulation intent vs operational error, dan selalu menyertakan estimated financial impact dalam setiap alert.

**MEMORY.md (Accumulated Leak Intelligence):**

```markdown
## Known Baseline Variances (Not Anomalies)
- Rute SBY-AMQ selalu 18-22% di atas expected fuel karena kondisi jalan.
  Baseline harus di-adjust untuk rute ini — jangan flag sebagai anomali.
- Vendor Cepat Kilat selalu invoice lebih lambat 14 hari dari delivery.
  Bukan rate anomaly — prosedur internal mereka.

## Confirmed Leak Patterns
- [2026-12-05] Driver kelompok "Armada Barat" konsisten 
  fuel overconsumption di rute JKT-MDN. Korelasi dengan refuel receipt gap.
  Status: Escalated ke Branch Head. Audit fisik dijadwalkan.
- [2026-11-20] TP rate untuk Activity A2 (Last-Mile) di Arandy 
  menggunakan rate lama pre-Oct 2026. Sudah di-correct Finance.

## False Positive History (Jangan Alert Ulang)
- Cabang Makassar selalu invoice dengan kode yang berbeda dari 
  cabang lain — bukan duplicate invoice, prosedur regional mereka.
- Diskon > standard untuk PT Pelabuhan Nusantara adalah approved 
  strategic pricing — ada MOU. Jangan flag sebagai unauthorized discount.
```

**prefetch() — Sebelum Setiap Domain Scan:**

```
prefetch("financial anomalies and vendor disputes"):
→ Semua CostEntry vendor dari 7 hari terakhir vs contractedRate
→ Trip margin computation terbaru dengan outlier flagging
→ Invoice Dispute objects yang terbuka
→ ICT Pending yang mendekati deadline
→ GPS fuel data vs refuel receipts (7 hari terakhir)
→ Shared Context Store: apakah ada vendor yang sudah di-flag agent lain?
```

**on_pre_compress() — Critical for Leak Evidence Preservation:**

Ini sangat penting untuk Revenue Leak Agent karena investigasi leak bisa berlangsung berhari-hari (multi-session). Sebelum sesi di-compress:

1. Semua "leak kandidat" yang belum ter-konfirmasi → simpan ke `LeakQueue` di external store dengan full evidence trail
2. Evidence chain (sequence of tool calls + results) yang membangun kasus leak → simpan ke `LeakEvidence` store
3. Cross-agent publish: jika vendor di-flag sebagai anomali → update `entity_registry/vendor_risk.json` di Shared Context Store → Dispatch Agent membaca ini otomatis

### Domain Pemantauan

*(5 domain dari versi sebelumnya tetap: Trip Profitability Anomaly, Fuel Anomaly Detection, Invoice Integrity Check, Vendor Rate Anomaly, IntercoTransaction Leak Check)*

**Enhancement: Memory-Aware Baseline Comparison**

Setiap anomaly detection sekarang di-filter melalui MEMORY.md untuk mengeliminasi false positives yang sudah diketahui:

```
Deteksi: Rute SBY-AMQ fuel consumption 20% di atas expected.
Memory check: MEMORY.md entry "Rute SBY-AMQ baseline +18-22% karena kondisi jalan"
Result: 20% masih dalam memory-adjusted range → NOT flagged
(tanpa memory, ini akan jadi false positive alert setiap hari)
```

**Leak Pattern Report** sekarang menyertakan **Evidence Lineage** — chain dari raw data → signal detection → pattern confirmation, dengan session IDs yang bisa di-lookup di episodic memory untuk full detail.

### Severity Classification dan Weekly Leak Report

*(Sama dengan versi sebelumnya)*

Tambahan baru: Weekly Leak Report sekarang menyertakan **Memory-Based Trend Analysis**:

- Apakah pattern leak yang sama sudah pernah terjadi di bulan sebelumnya? (dari episodic memory query)
- Berapa kali pattern ini muncul dalam 6 bulan terakhir?
- Apakah ada resolusi sebelumnya yang bisa dijadikan template?

***

## Agent 4 — Dispatch Intelligence Agent

### Peran dan Tanggung Jawab

Dispatch Intelligence Agent mengoptimasi penugasan armada dan vendor untuk setiap Trip baru. Di Phase 2 tetap rekomendatif — Dispatcher manusia yang memutuskan, tapi dengan informasi jauh lebih kaya.[^1]

### Memory Profile — Dispatch Agent

**SOUL.md:**
Agent ini di-define sebagai logistic optimization intelligence yang selalu menyajikan minimum 2 alternatif, selalu menampilkan trade-off secara eksplisit, dan tidak pernah merekomendasikan vendor yang memiliki active dispute di entity_registry Shared Context Store tanpa disclosure eksplisit.

**MEMORY.md (Accumulated Route \& Vendor Intelligence):**

```markdown
## Vendor Performance Memory (Auto-Updated Weekly)
- Vendor Maju Jaya SBY-BPN: reliability turun 15% sejak ganti armada Okt 2026.
  Kurangi bobot 10 poin untuk rute ini.
- Vendor Cepat Kilat JKT-SBY: sangat reliable untuk ColdChain cargo.
  Naikan priority untuk HandlingFlag = ColdChain.

## Route Seasonal Intelligence
- Selat Makassar: ferry delay 4-8 jam di minggu ke-3 setiap bulan (PELNI schedule)
  → Tambahkan 6 jam buffer untuk committedDeliveryAt rute via laut Makassar minggu ke-3
- JKT-BPN darat: macet Puncak selalu H-2 Lebaran, backup via toll perlu diaktifkan
- Sorong dan Fakfak: hanya ada 2 jadwal ferry per minggu — manifest harus kejar jadwal ini

## Override Pattern Analysis
- Dispatcher A sering override vendor Kilat Express → hasilnya rata-rata lebih buruk (-8% on-time)
  → Flag ketika Dispatcher A override rekomendasi ini, tanya konfirmasi
- Dispatcher B sering override untuk ColdChain → hasilnya biasanya lebih baik
  → Mungkin Dispatcher B punya informasi vendor informal yang tidak ada di sistem

## Entity Risk Flags (Dari Shared Context Store)
- Vendor Y: rate dispute aktif (dari Revenue Leak Agent, 2026-12-08)
  → Tidak rekomendasikan sampai dispute resolved, atau disclosure mandatory
```

**prefetch() — Sebelum Setiap Trip Assignment:**

```
prefetch("dispatch context for trip [origin] to [destination]"):
→ Available vendors untuk rute ini + current reliability scores
→ Current hub load di semua hub transit yang relevan
→ Weather/disruption alerts (dari Incident objects) di rute yang feasible
→ Historical on-time rate: vendor × rute × timing combination (90 hari)
→ Shared Context Store: vendor risk flags, hub capacity warnings dari Branch Agent
→ Customer SLA history: apakah customer ini punya historis complaint tentang delay?
→ MEMORY.md route seasonal patterns untuk tanggal pengiriman ini
```

**sync_turn() + Override Learning:**

Setiap Dispatcher override yang terjadi di-persist dengan:

- Opsi yang direkomendasikan vs opsi yang dipilih
- Stated reason dari Dispatcher
- Outcome 72 jam kemudian (on-time atau tidak, margin aktual vs estimasi)

Data ini mengisi `Override Training Store` yang menjadi input kalibrasi bulanan di **on_pre_compress()**.

### Optimization Logic

*(5 faktor dari versi sebelumnya tetap: Cost 25%, SLA 30%, Margin 20%, Vendor Reliability 15%, Network Load Balancing 10%)*

**Enhancement: Memory-Adjusted Scoring**

```
AdjustedVendorScore = BaseReliabilityScore 
  × MEMORY.getVendorAdjustment(vendor, route)    // dari vendor performance memory
  × SharedContext.getRiskMultiplier(vendor)       // dari entity_registry (dispute flags)

AdjustedRouteSLA = BaseSLAProbability 
  × MEMORY.getSeasonalFactor(route, date)         // ferry schedule, seasonality
  × SharedContext.getHubCapacityFactor(hubId)     // dari Branch CEO Agent
```


### Output Decision Card

*(Format sama dengan versi sebelumnya)*

Tambahan baru: **Memory Evidence Block** dalam setiap Decision Card:

```
🧠 MEMORY EVIDENCE:
  - Vendor X on rute ini: 23 trips dalam 90 hari, 91% on-time [episodic]
  - Rute via Hub Makassar: tidak ada seasonal flag untuk tanggal ini [MEMORY.md]
  - Vendor Y di-skip: active rate dispute per 2026-12-08 [shared context]
  - Override warning: Dispatcher A punya track record -8% vs recommendation 
    untuk vendor Kilat Express [override history, 7 data points]
```


### Load Balancing Intelligence

*(Network-level analysis setiap 6 jam — sama dengan versi sebelumnya)*

Enhancement: Dispatch Agent sekarang memiliki **shared context integration** — ketika Branch CEO Agent mempublikasikan "Makassar hub approaching 85% capacity besok" ke Shared Context Store, Dispatch Agent membaca ini via external memory provider dan otomatis memasukkan Makassar capacity constraint ke dalam load balancing calculation berikutnya — tanpa harus dipanggil secara eksplisit.

***

## Agent 5 — Branch CEO Agent

### Peran dan Tanggung Jawab

Branch CEO Agent adalah diagnostic system per cabang — memberikan setiap Branch Head "executive mirror" yang objektif, berdasarkan data.[^1]

### Memory Profile — Branch CEO Agent

**SOUL.md:**
Agent ini di-define sebagai branch intelligence yang berbicara dalam bahasa operasional (bukan bahasa finance), tidak pernah membandingkan cabang satu dengan cabang lain secara public (hanya kepada COO/CEO), dan selalu menyertakan benchmark "cabang sejenis" ketika memberikan assessment.

**MEMORY.md (Per-Branch Intelligence):**

```markdown
## Branch-Specific Baselines
- Cabang Makassar: warehouse occupancy selalu 70-80% di Q4 — normal
  (bukan tanda overload kecuali > 85%)
- Cabang Surabaya: OBL score rendah bulan Juni bukan performance issue 
  — Branch Head sedang training batch, legacy driver belum di-onboard ke sistem
- Cabang Ambon: customer concentration top-3 > 75% adalah structural 
  (sedikit customer besar di area) — risk flag tapi mitigasinya berbeda dari mainland

## Bottleneck Pattern History
- Dock congestion Makassar: peak jam 13:00-15:00 karena jadwal armada masuk bersamaan.
  Rekomendasi sudah diberikan Nov 2026: split jadwal. Status: implemented, 
  menunggu konfirmasi improvement.
- Driver bottleneck Surabaya: 3 driver senior konsisten incident lebih rendah — 
  assign ke high-value cargo cargo.

## Cross-Branch Intelligence (dari Shared Context Store)
- Branch Head Makassar accept rate untuk rekomendasi resource: 80%
- Branch Head Surabaya lebih respons terhadap financial framing vs operational framing
```

**prefetch() — Sebelum Branch Analysis:**

```
prefetch("branch health snapshot [branchId]"):
→ Current Branch P&L (dari BranchPL object, nightly computed)
→ Shipment on-time rate 30 hari terakhir untuk cabang ini
→ Active incidents dan resolution status
→ Customer concentration metrics (top-5 customer = berapa % revenue)
→ Fleet utilization dan idle time per armada
→ Warehouse occupancy time-series 30 hari
→ Shared Context Store events dari Dispatch dan Leak Agent untuk cabang ini
→ MEMORY.md: branch-specific baselines dan known patterns
```


### Analytic Modules

*(4 module dari versi sebelumnya tetap: Branch Health Score, Profit Forecast Engine, Bottleneck Identification, Resource Planning Recommendation)*

**Enhancement: Memory-Driven Comparative Analysis**

Branch Health Score sekarang di-contextualize dengan MEMORY.md:

```
Branch Health Score: 62/100
Memory Context: 
  "Score ini 8 poin di bawah cabang sejenis (Hub Gateway profil),
   tapi 12 poin di atas score cabang ini 6 bulan lalu."
  "Improvement driver: on-time rate naik 7pp setelah implementasi 
   split schedule dock yang direkomendasikan Nov 2026." [dari episodic memory]
  "Remaining gap: Fleet utilization masih 5pp di bawah benchmark 
   — belum ada perubahan sejak flag pertama kali 2026-10-15."
```

Analisis seperti ini — yang menyebut rekomendasi spesifik yang pernah diberikan dan menelusuri implementasinya — hanya mungkin karena **episodic memory** yang menyimpan semua history rekomendasi dan follow-up per cabang. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/42e1bb56-7ace-4072-bb6f-13c379240f64/Memahami_Ontology_Foundational_Reading_C-Level_ABC_Express-2.pdf)

**Branch Action Agenda — Memory-Enhanced:**

Setiap Senin, Branch CEO Agent menghasilkan Action Agenda yang menyertakan **continuity context** dari sesi sebelumnya:

```
BRANCH ACTION AGENDA — Cabang Makassar | Minggu 8–14 Des 2026

🔁 FOLLOW-UP DARI MINGGU LALU:
  ✅ Split jadwal dock: implementasi dilaporkan selesai.
     Perlu validasi data 2 minggu ke depan — flag untuk review 22 Des.
  ⏳ Audit driver kelompok Barat: belum ada update dari Branch Head.
     Eskalasi ke COO jika tidak ada tindakan dalam 48 jam.
  ❌ Diversifikasi vendor: belum dimulai. Reminder dikirim.

📋 ACTION ITEMS MINGGU INI:
  1. [FINANCIAL] Revenue forecasted Rp 4.2M di bawah target akhir bulan.
     Driver: 2 contract CGL1 belum invoice. Konfirmasi ke Finance.
  2. [OPERATIONAL] Hub occupancy akan menyentuh 88% Rabu 10 Des pukul 14:00
     berdasarkan manifest yang sudah confirmed. Perlu keluarkan 
     3 manifest non-urgent lebih awal.
  3. [COMMERCIAL] PT Nusantara Indah dormancyDays = 19 (CGL2 threshold = 21).
     Pre-emptive contact sebelum masuk alert territory.
```

Format ini hanya bisa dihasilkan karena agent menyimpan action items minggu lalu di episodic memory dan mengecek status setiap follow-up sebelum membuat agenda baru.

***

## Komponen Lintas Agent: Shared Intelligence Layer

### Cross-Agent Memory Architecture

Lima agent di ABC Express tidak berjalan dalam silo. Mereka dihubungkan oleh **Shared Context Store** yang diimplementasi sebagai append-only event log — tidak ada yang boleh menghapus atau mengedit entry yang sudah ada. Ini adalah **institutional memory lintas-agent** yang immutable. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/42e1bb56-7ace-4072-bb6f-13c379240f64/Memahami_Ontology_Foundational_Reading_C-Level_ABC_Express-2.pdf)

**Struktur Shared Context Store:**

```
~/.abcexpress_agents/shared_context_store/
├── events.log           (append-only, immutable, semua cross-agent events)
├── entity_registry/
│   ├── vendor_risk.json     (risk flags per vendor, updated oleh Leak Agent)
│   ├── customer_risk.json   (churn scores per customer, updated oleh Churn Agent)
│   ├── hub_capacity.json    (hub load forecasts, updated oleh Branch Agent)
│   └── route_alerts.json    (disruptions aktif, updated oleh COO Agent)
└── decision_archive/
    └── approved_decisions/  (semua decisions yang di-approve, immutable)
```

**Mekanisme Cross-Agent Event Flow:**

Setiap agent **subscribe** ke event types yang relevan dengan domain-nya, dan **publish** findings yang relevan untuk agent lain:

```
Revenue Leak Agent deteksi:
  → [PUBLISH] event: VendorRateDispute {vendor: "Y", amount: 12.5jt, trips: 5}
  → entity_registry/vendor_risk.json diupdate: Vendor Y risk_score += 30

Dispatch Agent (via external memory prefetch):
  → [SUBSCRIBE] membaca vendor_risk.json sebelum setiap recommendation
  → Auto-adjust: Vendor Y reliability score -30 poin sementara
  → Semua recommendation yang menyebut Vendor Y: wajib include disclosure

COO Agent (via system_prompt_block + prefetch):
  → [SUBSCRIBE] membaca semua events.log 24 jam terakhir
  → Memasukkan "Vendor Y dispute aktif" ke Morning Briefing otomatis

Churn Agent (via queue_prefetch):
  → [SUBSCRIBE] membaca customer_risk.json setiap 6 jam
  → Jika Branch CEO Agent publish "cabang X revenue concentration risk tinggi"
    → Churn Agent meningkatkan sensitivity untuk customers di cabang itu

Branch CEO Agent:
  → [PUBLISH] hub_capacity.json update: "Makassar akan 88% Rabu 14:00"
  → [SUBSCRIBE] membaca customer_risk.json untuk cabang-cabangnya
```

**Kenapa Append-Only dan Immutable:**

events.log tidak boleh di-edit atau di-delete karena ini adalah **audit trail lintas-agent**. Jika investigasi fraud dimulai — misalnya ada kecurigaan bahwa seseorang sengaja memanipulasi vendor rate — investigator bisa menelusuri: kapan Leak Agent pertama kali flag vendor ini, apakah alert sudah sampai ke Dispatch Agent, apakah COO sudah di-briefing, dan apakah ada yang mengabaikan alert ini. Chain of custody yang lengkap dan tidak bisa dimanipulasi. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/9db1f3cb-7307-4bdf-b7a7-35a65a77915a/Validation_Kit_v0.1_ABC_Express-4.pdf)

### Cross-Agent Memory Propagation: Workflow Nyata

Berikut adalah contoh nyata bagaimana memory lintas-agent bekerja dalam satu hari operasional:

```
05:00 WIB — COO Agent startup
  prefetch() membaca events.log 24 jam terakhir:
  → Ada 3 cross-agent events baru semalam
  → Vendor Y dispute (dari Leak Agent kemarin 22:15)
  → Makassar hub 78% capacity (dari Branch Agent kemarin 21:30)
  → Customer PT Cemerlang ChurnRisk = 74 (dari Churn Agent kemarin 23:45)
  → Semua masuk ke Morning Briefing sebagai terintegrasi, bukan 3 alert terpisah

07:15 WIB — CEO membuka briefing
  → Melihat 3 item terkait di satu panel terintegrasi
  → Klik "Accept" untuk eskalasi Vendor Y ke Finance Lead
  → Decision ter-persist di decision_archive
  → on_memory_write() trigger: mirror ke Shared Context Store
  → COO Agent update USER.md: "CEO accept vendor dispute escalation — 
     konsisten dengan pattern sebelumnya"

09:00 WIB — Dispatch Agent menerima trip baru JKT → MKS
  prefetch() membaca entity_registry:
  → Vendor Y: risk_score tinggi (dari Leak Agent + COO decision)
  → Hub Makassar: 78% capacity (dari Branch Agent)
  → Route seasonal: tidak ada flag untuk tanggal ini (dari COO MEMORY.md)
  → Recommendation: Vendor X via Hub Surabaya (bukan Makassar)
    dengan Memory Evidence Block yang reference semua data di atas

11:30 WIB — Revenue Leak Agent weekly scan
  prefetch() membaca dispatch decisions 7 hari terakhir:
  → Vendor Y digunakan 2x meski ada risk flag
  → Kedua trip di-authorize oleh Branch Head Surabaya dengan reason "emergency"
  → Leak Agent flag: "Pattern penggunaan vendor saat dispute — 
     perlu klarifikasi apakah ada bypass sistematis"
  → PUBLISH ke events.log → COO Agent membaca di briefing besok pagi
```

Inilah **emergent intelligence** sesungguhnya — bukan satu agent yang kompleks, tapi lima agent yang memori mereka saling memperkuat satu sama lain. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fc163afc-e9cf-4db4-8b01-769b8f0affd8/SESSION-3.txt)

### Conflict Resolution Protocol (Memory-Enhanced)

Ketika dua agent menghasilkan rekomendasi yang bertentangan, Agent Orchestrator menjalankan conflict resolution — sekarang dengan tambahan **memory context**:

**Contoh konflik:**
COO Agent: "Tahan 3 armada Makassar untuk lonjakan demand besok"
Dispatch Agent: "Dispatch armada yang sama ke Sorong hari ini karena SLA urgent"

Orchestrator conflict resolution (memory-enhanced):

```
Step 1: Load episodic memory untuk kasus serupa
  session_search query: "armada conflict Makassar demand vs SLA"
  → Menemukan 2 kasus serupa dalam 90 hari
  → Kasus 1: COO Agent benar — lonjakan demand terjadi, armada dibutuhkan
  → Kasus 2: Dispatch Agent benar — SLA breach terjadi, armada harusnya dikirim

Step 2: Load entity context
  → Customer Sorong trip: tier Strategic, historis SLA breach complaint 2x
  → Makassar demand forecast: berdasarkan seasonal pattern, 65% probability

Step 3: Priority Resolution Matrix dengan memory-adjusted weights
  SLA untuk existing customer + high complaint history 
    > Probabilistic demand forecast yang belum confirmed

Step 4: Resolution
  → Dispatch armada ke Sorong (Dispatch Agent benar)
  → Cari armada cadangan untuk Makassar dari vendor pool
  → Log conflict + resolution ke events.log

Step 5: Memory update
  → on_pre_compress() setelah sesi: update "conflict pattern" di MEMORY.md
    kedua agent — "SLA breach risk existing customer 
    > forecast demand Makassar jika confidence < 70%"
```

Setiap conflict dan resolusinya tersimpan — dan menjadi **preseden** yang memengaruhi resolusi konflik serupa di masa depan. Ini adalah learning yang tidak perlu retraining model.

***

## Komponen Teknikal Baru di Phase 2

### LLM Integration Layer (Memory-Aware)

**Context Window Management — Sekarang Dikelola oleh Memory Architecture**

Context window tidak lagi di-manage secara naif (semuanya masuk sampai penuh lalu dipotong). Memory architecture mengatur ini secara sistematis:

```
Komposisi Context Window (prioritas dari atas ke bawah):
  1. SOUL.md + USER.md (tidak pernah di-compress)     ~500 tokens
  2. MEMORY.md (tidak pernah di-compress)              ~1.000 tokens
  3. Skills + Context files (stable, jarang berubah)   ~2.000 tokens
  4. system_prompt_block() dari external memory        ~800 tokens
  5. prefetch() result (real-time data)                ~3.000 tokens
  6. Last 20 messages (protected from compression)     ~8.000 tokens
  7. Middle turns summary (hasil compression)          ~2.000 tokens
  ─────────────────────────────────────────────────────────────────
  Total managed: ~17.300 tokens dari 128K window
  Reserve untuk LLM reasoning output: ~110K tokens
```

Strategi ini memastikan bahwa data paling penting (persona, accumulated insights, real-time context) selalu ada di context window — sementara conversation history yang lama di-compress secara sistematis tanpa kehilangan informasi kritis.

**Prompt Version Control (Immutable + Versioned)**

Setiap prompt component di-version dan di-hash:

```
Prompt Version Manifest:
{
  "session_id": "coo_agent_20261215_0530",
  "prompt_components": {
    "SOUL.md": {"version": "v1.2", "hash": "a3f7b9...", "last_modified": "2026-11-10"},
    "MEMORY.md": {"version": "v47", "hash": "d8c2e1...", "last_modified": "2026-12-14"},
    "USER.md": {"version": "v23", "hash": "f1a4b2...", "last_modified": "2026-12-13"},
    "skills/sla_rules": {"version": "v3", "hash": "9e7f3a...", "last_modified": "2026-10-01"},
    "prefetch_query": "kondisi operasional 2026-12-15",
    "prefetch_result_hash": "c4d5e6..."
  }
}
```

Manifest ini di-persist bersama setiap session record. Investor atau auditor bisa bertanya: "Dengan versi MEMORY.md yang mana agent membuat rekomendasi X pada tanggal Y?" — dan sistemnya bisa menjawab dengan tepat. Ini adalah **auditability yang tidak dimiliki sistem AI konvensional manapun**. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fca930b9-f11d-439c-8693-6bec5f8a4347/Kajian_Strategis_DSV_untuk_ABC_Express_v1_0.pdf)

**Hallucination Guard — Grounding Check**

Setiap kali LLM mengklaim fakta spesifik tentang entitas ("vendor X punya reliability score 72"), sistem menjalankan **grounding verification** otomatis sebelum output diteruskan ke user:

```
LLM output: "Vendor Kilat Express memiliki reliability score 72 
             berdasarkan 90 hari terakhir."

Grounding check:
→ Query OntologyReadTool: Vendor.reliabilityScore where name = "Kilat Express"
→ Result: 78 (bukan 72)
→ Discrepancy detected!

Action:
→ Jika discrepancy < 10%: auto-correct + log "minor hallucination"
→ Jika discrepancy > 10%: hold output, flag untuk manual review
→ Jika entity tidak ditemukan: replace dengan "data tidak tersedia" + log "entity hallucination"
→ Semua hallucination events di-aggregate ke Agent Performance Report
```

Grounding check ini berjalan untuk **setiap angka, setiap nama entity, setiap persentase** yang ada dalam output LLM. Semakin banyak data di ontology, semakin ketat grounding yang bisa dilakukan.

### Memory-Native Feedback Loop Engine

Feedback Loop Engine di Phase 2 sekarang sepenuhnya terintegrasi dengan memory architecture — bukan lagi komponen terpisah yang mengumpulkan rating:

**Aliran Feedback Implicit (Primary Signal):**

```
Rekomendasi dibuat oleh Agent (ter-record di episodic memory)
    ↓
Manusia membuat keputusan (Accept/Override/Dismiss — ter-record di AuditTrail)
    ↓
72 jam kemudian: Outcome Tracking Job berjalan
  → Query: apakah outcome dari keputusan ini positif atau negatif?
  → Positif: shipment on-time, customer tidak jadi churn, leak di-stop
  → Negatif: SLA breach, churn terjadi, leak berlanjut
    ↓
Outcome di-append ke record rekomendasi di episodic memory (field: outcome_feedback)
    ↓
on_pre_compress() atau monthly calibration: aggregate semua outcomes
  → Update bobot scoring di MEMORY.md
  → Publish ke Agent Performance Report
```

**Aliran Feedback Explicit (Secondary Signal):**

Setiap user bisa memberikan rating 1–5 pada rekomendasi agent, dengan komentar optional. Ini jarang terjadi tapi bernilai tinggi karena mengandung **konteks kualitatif** yang tidak ada di data:

```
COO menolak rekomendasi dispatch dengan komentar:
"Vendor ini sudah lama kerja sama dengan kita, jangan diblokir hanya karena 
satu dispute belum selesai."

on_memory_write() triggered:
→ COO Agent menulis ke MEMORY.md:
  "CEO value long-term vendor relationship di atas short-term dispute risk.
   Untuk vendor dengan relationship > 2 tahun, kurangi penalty dari dispute flag."
→ Dispatch Agent juga mendapat copy via on_memory_write mirror:
  → MEMORY.md Dispatch Agent diupdate dengan relationship_tenure modifier
```

**Monthly Calibration Session:**

Setiap bulan, semua agent menjalankan **calibration session** yang mengagregasi semua feedback dan mengupdate MEMORY.md secara sistematis:

```
Calibration Inputs:
  - Semua outcome_feedback dari 30 hari terakhir (dari episodic memory)
  - Acceptance rate per rekomendasi category
  - Override patterns dan outcomes
  - Explicit feedback dari users
  - False positive / false negative counts per agent

Calibration Outputs (ditulis ke MEMORY.md masing-masing agent):
  - Updated scoring weights
  - New seasonal patterns yang ter-konfirmasi
  - Invalidated patterns yang terbukti false
  - New entity-specific modifiers (vendor, customer, route)
  - Updated user preference profiles (USER.md)
```

Ini adalah **learning tanpa retraining** — agent makin cerdas seiring waktu bukan karena model-nya berubah, tapi karena MEMORY.md-nya semakin kaya dan akurat.

### Agent Performance Report (Memory-Grounded)

Setiap minggu, Feedback Loop Engine menghasilkan laporan performa semua agent yang sekarang jauh lebih kaya karena berbasis episodic memory:

```
AGENT PERFORMANCE REPORT — Minggu 8–14 Des 2026

COO AGENT
  Briefing generated: 7 (setiap hari)
  Items in briefing: avg 8.3 per hari (dalam target ≤ 10)
  CEO acceptance rate: 71% (target > 60%) ✅
  Hallucination events: 2 (minor, auto-corrected)
  Memory writes this week: 3 entries baru ke MEMORY.md
  Accuracy trend: 68% → 71% (MoM improvement)

CHURN DETECTION AGENT
  Alerts generated: 12 (9 High, 3 Critical)
  True positive rate: 78% (8 dari 10 yang sudah bisa di-validate)
  False positive rate: 22% — 2 ternyata seasonal (Ramadan pattern)
    → Recommend: update MEMORY.md seasonal suppression list
  Recovery actions initiated: 3 (dari 49 churned accounts pipeline)
  Revenue recovered estimate: Rp 340 juta (partial win-back)

DISPATCH INTELLIGENCE AGENT
  Recommendations generated: 284
  Acceptance rate: 68% (target > 65%) ✅
  Override rate: 32% — breakdown:
    - Strategic override (relationship): 18% → Normal
    - Override with better outcome: 8% → Agent learning gap
    - Override with worse outcome: 6% → Human error, agent was right
  Average margin improvement vs pre-agent baseline: +4.2% ✅
  Memory writes: 7 vendor performance updates ke MEMORY.md

REVENUE LEAK AGENT
  Scan coverage: 100% invoice (target 100%) ✅
  Leak candidates flagged: 23
  Confirmed leaks: 15 | False positives: 8
  Total leak value confirmed: Rp 892 juta
  Running total recovered (since launch): Rp 3.2 miliar
  Cross-agent events published: 4 (3 vendor flags, 1 route anomaly)

BRANCH CEO AGENT
  Branches covered: 6/6
  Branch Health Scores updated: daily ✅
  Action Agenda delivered: 6 (weekly, all branches)
  Follow-up tracking rate: 87% (action items tracked to resolution)
  Branch Head access rate: 4.2x/week avg (target ≥ 3x) ✅
  Escalations to COO triggered: 2 (1 resolved, 1 pending)
```

***

## Dashboard Phase 2: War Room v2 (Memory-Integrated)

War Room v2 bukan sekadar upgrade visual dari v1. Ia adalah **window ke dalam semua agent dan memory mereka secara bersamaan** — satu tempat di mana semua intelligence yang dihasilkan oleh 5 agent dan 4-layer memory mereka terkonsolidasi. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fc163afc-e9cf-4db4-8b01-769b8f0affd8/SESSION-3.txt)

### Panel Baru: Agent Memory Status

Panel baru yang **tidak ada di versi sebelumnya** — menampilkan "kesehatan" memory setiap agent:

```
AGENT MEMORY STATUS PANEL

COO Agent
  MEMORY.md: 47 entries | Last write: 2 jam lalu
  Sessions (episodic): 94 sessions | FTS5 indexed ✅
  External memory: 1.247 records | Last sync: 14 mnt lalu
  Prefetch latency: avg 180ms ✅
  Calibration: terakhir 1 Des, next 1 Jan ✅

Churn Agent
  MEMORY.md: 31 entries | Last write: kemarin
  Sessions: 186 sessions | FTS5 indexed ✅
  [...]

Shared Context Store
  events.log: 1.842 entries (append-only)
  Active vendor risk flags: 3
  Active customer risk flags: 12
  Active hub capacity warnings: 1
  Last cross-agent event: 23 mnt lalu
```

Panel ini penting untuk ops team — jika external memory backend down (sync_turn() gagal terus), terlihat di sini sebelum berdampak ke kualitas rekomendasi.

### Panel Upgrade: COO Briefing Interactive + Memory Trace

Setiap item dalam Morning Briefing sekarang punya tombol **"Show Memory Trace"** yang membuka panel samping:

```
[Item: Vendor Y rate dispute — CRITICAL]

📋 REASONING CHAIN (dari session #4521):
  1. Revenue Leak Agent flag Vendor Y (2026-12-08 22:15)
     via Shared Context Store event
  2. Dispatch Agent auto-reduced reliability score -30 poin
     berdasarkan entity_registry update
  3. COO Agent prefetch() membaca events.log pagi ini
  4. MEMORY.md check: tidak ada historical exception untuk Vendor Y
  5. Priority Index: Urgency 75, Impact 82 → Final 78 (HIGH)

🧠 MEMORY EVIDENCE:
  Dari MEMORY.md: "Vendor dengan dispute aktif tanpa exception 
                   history = rekomendasikan eskalasi ke Finance Lead"
  Dari episodic memory (session #3847, 45 hari lalu):
    "Dispute vendor serupa di-resolve dalam 5 hari dengan 
     direct Finance to vendor contact"

⚡ SIMILAR PAST CASES (via session_search FTS5):
  → Kasus 1: Vendor Z dispute Nov 2026 — resolved 4 hari
  → Kasus 2: Vendor A dispute Sep 2026 — resolved 12 hari (complicated)
```

Ini adalah level transparansi yang belum pernah ada di sistem AI enterprise manapun di Indonesia — dan ini adalah **moat IPO yang sesungguhnya**. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fca930b9-f11d-439c-8693-6bec5f8a4347/Kajian_Strategis_DSV_untuk_ABC_Express_v1_0.pdf)

### Panel Baru: Cross-Agent Intelligence Flow

Visualisasi real-time yang menampilkan event yang sedang mengalir di Shared Context Store:

- Timeline view: event dari agent mana, ke agent mana, kapan, tentang apa
- Filter per entity type (vendor / customer / branch / route)
- Highlight event yang sudah di-act vs yang masih pending
- Drill-down ke full event payload untuk investigasi

### Panel Baru: Agent Memory Explorer (Admin View)

Khusus untuk tim teknikal dan Admin, panel ini memungkinkan **inspect dan debug memory** semua agent:

- Lihat isi MEMORY.md setiap agent (read-only untuk non-admin)
- Search di episodic memory via FTS5 dengan query bebas
- Timeline MEMORY.md changes — kapan entry dibuat, diupdate, diinvalidasi
- Override simulation: "Jika seasonal suppression ini di-remove dari MEMORY.md, berapa banyak false alerts yang akan muncul minggu ini?"

### Panel Upgrade: Branch CEO View (Memory-Enhanced)

Branch Head sekarang bisa melihat **historical continuity**:

- Action items dari 4 minggu terakhir dan status masing-masing
- "Agent sudah merekomendasikan ini berapa kali?" — untuk item yang terus direkomendasikan tapi tidak di-act
- Branch Health Score trend 90 hari (bukan hanya 30 hari)
- Comparison dengan branch profil serupa (di-pull dari episodic memory agent yang sudah belajar benchmark)

***

## Governance Phase 2: Human-in-the-Loop + Memory Governance

### Human-in-the-Loop Framework

*(Sama dengan versi sebelumnya — semua action tetap membutuhkan human approval di Phase 2, dengan approval chain yang sama)*

Tambahan penting: **Memory Governance**

Memory bukan hanya teknikal — ia adalah **aset bisnis** yang harus dikelola dengan governance yang jelas.

### Memory Governance Framework

**Who Can Write to MEMORY.md:**

Hanya dua pihak yang boleh mengubah MEMORY.md setiap agent:

1. **Agent itu sendiri** — via `memory` tool yang di-intercept oleh Agent Runtime, dengan character limit dan format validation
2. **Business Owner domain** via **Memory Override Interface** di dashboard — dengan mandatory reason field dan approval dari Chief Transformation Officer

Perubahan manual oleh Business Owner digunakan untuk:
- Menginject pengetahuan bisnis yang tidak bisa diperoleh agent dari data (misalnya "PT X sedang dalam proses akuisisi — jangan treat sebagai churn risk")
- Mengoreksi MEMORY.md yang berisi pattern yang sudah tidak relevan
- Menambahkan constraint bisnis baru (misalnya "setelah kebijakan baru, diskon > 15% wajib Director approval")

**Memory Audit Trail:**

Setiap perubahan ke MEMORY.md di-tracked:

```
MEMORY.md Change Log (immutable):
{
  timestamp: "2026-12-10T14:23:00Z",
  agent: "churn_agent",
  change_type: "AGENT_WRITE",
  entry: "PT Cemerlang volume drop Desember = internal audit — bukan churn",
  trigger_session: "churn_agent_20261210_1420",
  trigger_evidence: "3 consecutive December drops in episodic history"
}

{
  timestamp: "2026-12-11T09:15:00Z",
  agent: "coo_agent",
  change_type: "HUMAN_OVERRIDE",
  entry: "Makassar ferry delay week-3 = PELNI schedule, not operational",
  modified_by: "Pak Andi (Founder/CEO)",
  reason: "Sudah terjadi 12 bulan berturut-turut — confirm seasonal",
  approved_by: "Chief Transformation Officer",
  evidence_reference: "Manifest data Q4 2024, Q4 2025"
}
```

Audit trail ini menjawab pertanyaan investor: "Bagaimana kalian memastikan AI tidak membuat keputusan berdasarkan informasi yang salah?" — jawabannya ada di Change Log yang bisa di-review line by line. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fca930b9-f11d-439c-8693-6bec5f8a4347/Kajian_Strategis_DSV_untuk_ABC_Express_v1_0.pdf)

**Memory Health Monitoring:**

Setiap bulan, Chief Transformation Officer mereview **Memory Health Report** per agent:

- Berapa entries di MEMORY.md yang sudah > 6 bulan tanpa konfirmasi ulang → kandidat untuk review validitas
- Berapa entries yang pernah di-override oleh manusia → indikator gap antara "apa yang agent pelajari" vs "apa yang bisnis ketahui"
- Pattern apa yang paling sering mempengaruhi keputusan → ini adalah explicit knowledge yang bisa di-dokumentasikan formal ke SOP
- Apakah ada MEMORY.md entries yang berkontradiksi satu sama lain → perlu resolusi

### Approval Chain Design

*(Tabel sama dengan versi sebelumnya)*

Tambahan satu row baru untuk memory-related actions:

| Action Type | Nilai / Risiko | Approver |
|-------------|---------------|----------|
| Agent auto-write ke MEMORY.md | Knowledge, low risk | Otomatis (no approval) — tapi di-audit |
| Human manual write ke MEMORY.md | Knowledge, medium risk | Business Owner + CTO sign-off |
| Delete/invalidate MEMORY.md entry | Knowledge, high risk | Business Owner + Chief Transformation Officer |
| Reset episodic memory (full wipe) | Knowledge, critical | CEO + CTO + backup verification |
| Export episodic memory untuk audit | Data governance | CFO/Legal approval |

### Action Expiry Policy

*(Sama dengan versi sebelumnya — 4 tier expiry dari 2 jam hingga 7 hari)*

***

## Architecture Decision Records (ADR) Phase 2

Setiap keputusan arsitektur memory yang signifikan di-dokumentasikan sebagai ADR — berlanjut dari ADR yang dimulai di Phase 1: [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fca930b9-f11d-439c-8693-6bec5f8a4347/Kajian_Strategis_DSV_untuk_ABC_Express_v1_0.pdf)

**ADR-005: Single External Memory Provider Per Agent**
- Konteks: Dipertimbangkan apakah memakai multi-provider (vector store + graph DB) secara bersamaan
- Keputusan: Single provider — mencegah tool schema bloat dan conflict resolution complexity
- Konsekuensi: Migration path lebih simpel; jika perlu ganti provider, cutover bersih

**ADR-006: sync_turn() Wajib Non-Blocking (Daemon Thread)**
- Konteks: Versi awal sync_turn() blocking — agent sering hang 2–5 detik menunggu vector store
- Keputusan: Semua sync_turn() harus daemon thread dengan retry queue
- Konsekuensi: Eventual consistency di memory — ada window kecil di mana memory belum ter-sync. Acceptable karena agent masih punya working memory dari sesi aktif

**ADR-007: on_pre_compress() sebagai Primary Intelligence Extraction Hook**
- Konteks: Dipertimbangkan untuk extract intelligence secara continuous setiap turn
- Keputusan: Batch extraction di on_pre_compress() lebih efisien dan menghasilkan insights yang lebih kohesif (punya full conversation context saat extraction)
- Konsekuensi: Jika agent crash sebelum on_pre_compress() berjalan, insights dari sesi tersebut mungkin tidak ter-save. Mitigasi: checkpoint setiap 20 turns

**ADR-008: Shared Context Store sebagai Append-Only Event Log**
- Konteks: Dipertimbangkan apakah shared store bisa di-edit (mutable)
- Keputusan: Strictly append-only — audit trail lintas-agent tidak boleh ter-modifikasi
- Konsekuensi: Storage tumbuh terus. Mitigasi: archive events > 12 bulan ke cold storage, tapi tetap queryable

**ADR-009: Profile Isolation Per Agent**
- Konteks: Dipertimbangkan shared MEMORY.md untuk efisiensi
- Keputusan: Fully isolated profiles — setiap agent punya MEMORY.md, sessions.db, dan external_memory sendiri
- Konsekuensi: Cross-agent knowledge sharing hanya via Shared Context Store (explicit), bukan via shared memory (implicit). Trade-off: lebih verbose tapi lebih controllable dan auditable

***

## Success Criteria Phase 2 — Definition of Done (Revised)

Phase 2 dinyatakan selesai jika **semua 9 kriteria berikut terpenuhi** (ditambah satu kriteria memory dari versi sebelumnya):

1. **COO Agent operational:** Morning briefing tersedia setiap hari sebelum pukul 06:00 WIB dengan acceptance rate > 60% untuk Critical items; MEMORY.md sudah punya minimum 20 confirmed patterns setelah 3 bulan operasi [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fc163afc-e9cf-4db4-8b01-769b8f0affd8/SESSION-3.txt)

2. **Churn Detection active:** 49 churned accounts sudah dianalisis dan win-back plan dibuat; ChurnRiskScore aktif untuk semua 1.588+ customer; zero Critical alert terlambat > 24 jam; ChurnRiskScore calibration pertama sudah berjalan setelah bulan ke-3 [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/42e1bb56-7ace-4072-bb6f-13c379240f64/Memahami_Ontology_Foundational_Reading_C-Level_ABC_Express-2.pdf)

3. **Revenue Leak Agent running:** Weekly Leak Report berjalan 8 minggu berturut-turut; minimum satu confirmed leak pattern dengan nilai > Rp500 juta ter-resolve; False Positive Rate < 30% (dibuktikan oleh episodic memory review) [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fc163afc-e9cf-4db4-8b01-769b8f0affd8/SESSION-3.txt)

4. **Dispatch Agent rekomendatif:** Acceptance rate > 65%; margin per trip improvement rata-rata > 3% vs baseline; Override Training Store sudah punya minimum 50 data points untuk monthly calibration pertama [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fc163afc-e9cf-4db4-8b01-769b8f0affd8/SESSION-3.txt)

5. **Branch CEO Agent deployed:** Semua 6 Branch Head akses minimum 3x/minggu; Branch Health Score aktif; Action Agenda follow-up tracking rate > 80% (dibuktikan oleh episodic memory continuity) [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fc163afc-e9cf-4db4-8b01-769b8f0affd8/SESSION-3.txt)

6. **Memory Architecture healthy:** Setiap agent punya MEMORY.md dengan minimum 15 confirmed entries; sync_turn() error rate < 0.1% (retry queue hampir tidak pernah dibutuhkan); on_pre_compress() ter-trigger dan ter-validate untuk semua agent; Shared Context Store events.log aktif dengan cross-agent flow yang terverifikasi [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/42e1bb56-7ace-4072-bb6f-13c379240f64/Memahami_Ontology_Foundational_Reading_C-Level_ABC_Express-2.pdf)

7. **Feedback Loop Engine running:** Minimum 200 rekomendasi ter-rated; Monthly Calibration pertama sudah berjalan; Agent Performance Report dihasilkan dan dipresentasikan ke COO setiap Senin [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fc163afc-e9cf-4db4-8b01-769b8f0affd8/SESSION-3.txt)

8. **Audit Trail complete dan Memory Audit Trail clean:** 100% action punya reasoning chain yang bisa di-trace; MEMORY.md Change Log lengkap untuk semua writes; Memory Health Report pertama sudah dihasilkan dan direview oleh Chief Transformation Officer; ADR-005 hingga ADR-009 terdokumentasi dan di-sign-off [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fca930b9-f11d-439c-8693-6bec5f8a4347/Kajian_Strategis_DSV_untuk_ABC_Express_v1_0.pdf)

9. **War Room Dashboard v2 operational:** Semua role-based view sudah upgraded dari v1 — CEO, COO, Commercial Director, Finance Lead, Branch Head masing-masing bisa akses panel yang sudah mencakup data agent (churn alerts, dispatch recommendation feed, branch health score) bukan hanya operational metrics dari Phase 1. Panel Customer Risk Radar sudah ter-feed langsung dari ChurnRiskScore real-time.

***

## Positioning: ABC Express Setelah Phase 2

Setelah Phase 2 selesai, ABC Express memiliki sesuatu yang **tidak bisa dibeli sebagai software siap pakai** — sebuah sistem AI yang sudah belajar tentang bisnis ABC Express secara spesifik selama berbulan-bulan. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fc163afc-e9cf-4db4-8b01-769b8f0affd8/SESSION-3.txt)

MEMORY.md setiap agent berisi pengetahuan tentang pola musiman ABC, vendor-vendor spesifik ABC, preferensi CEO dan COO ABC, dan ribuan nuance operasional yang hanya bisa diperoleh dari pengalaman langsung. Episodic memory menyimpan setiap keputusan, setiap rekomendasi, dan setiap outcome selama operasi berlangsung.

Ini adalah **moat yang sesungguhnya** — kompetitor bisa membeli LLM yang sama, membangun ontology yang serupa, tapi tidak bisa mereplikasi memory yang sudah terakumulasi. Semakin lama sistem berjalan, semakin besar keunggulan ini. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/42e1bb56-7ace-4072-bb6f-13c379240f64/Memahami_Ontology_Foundational_Reading_C-Level_ABC_Express-2.pdf)

> *"Agent bulan ke-12 bukan versi yang lebih baik dari agent yang sama. Ia adalah sistem yang berbeda secara fundamental — karena 12 bulan MEMORY.md, 12 bulan episodic history, dan 12 bulan kalibrasi dari ribuan keputusan nyata ABC Express yang tersimpan di dalamnya."*

Dari sinilah narasi IPO yang tidak bisa ditiru dibangun: **ABC Express bukan perusahaan logistik yang pakai AI. ABC Express adalah perusahaan yang memiliki AI yang sudah memahami logistik Indonesia lebih dalam dari siapapun**. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/115111682/fca930b9-f11d-439c-8693-6bec5f8a4347/Kajian_Strategis_DSV_untuk_ABC_Express_v1_0.pdf)
<span style="display:none">[^4]</span>

<div align="center">⁂</div>

[^1]: SESSION-3.txt

[^2]: Memahami_Ontology_Foundational_Reading_C-Level_ABC_Express-2.pdf

[^3]: Validation_Kit_v0.1_ABC_Express-4.pdf

[^4]: MVP-Phase-2_AI-AGENTIC-ABC-EXPRESS.md

