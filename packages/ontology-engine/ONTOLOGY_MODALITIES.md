# Ontology data modalities and persistence

This package describes **what** each property means. **Where** data lives depends on modality:

| Modality | Ontology hint | Typical storage | Search / AI |
|----------|---------------|-----------------|---------------|
| Structured scalars | `string`, `number`, `boolean`, `date`, `enum` | PostgreSQL columns via Prisma | Filters, sorts, SQL |
| JSON / arrays | `json`, `array` | `Json` columns or normalized child tables | Application logic, optional JSON path |
| Long text / rich text | `text`, `richText` + `semanticSearch` | `Text` columns; optional `tsvector` or vector index | Full-text or embedding search (staged) |
| Media | `media` + `media` config | Object storage (S3-compatible) + URL or `MediaAsset` table | Vision models, thumbnails (staged) |
| Geospatial | `geopoint` or lat/lon `number` pairs | Float columns; optional PostGIS later | Radius / route queries |
| Temporal | `date`, `datetime` | `DateTime` columns | Windows, SLAs, on-time KPIs |
| Simulated / derived | **Functions** (read-only) | Computed at query time or materialized views | Not stored as user input; version in app |

**Guardrails:** use `constraints` (min, max, pattern, currency) for validation in APIs; `referenceEnumName` ties values to shared enums.

**Staging:** `semanticSearch.embeddingIndexOrModel` and media storage are **contract fields**; wire to OpenSearch, pgvector, or S3 when those services are available.
