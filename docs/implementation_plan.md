# Implementation Plan

Dokumen ini menyusun hasil analisis `docs/checklist.md` untuk memastikan API siap production.
Fokusnya adalah memetakan apa yang sudah ada, apa yang masih parsial, dan apa yang perlu dibangun
tanpa overengineering.

## Ringkasan Status

Legenda:
- `Done` = sudah ada dan cukup jelas di codebase.
- `Partial` = ada fondasi, tetapi belum lengkap atau belum konsisten.
- `Todo` = belum ada implementasi yang relevan.

| Area | Status | Catatan |
| --- | --- | --- |
| API response envelope | Done | Sudah ada `ResponseEnvelopeInterceptor` dan helper response. |
| Business error code | Done | Sudah ada kode error terpusat di exception filter untuk kasus umum. |
| Versioning API | Done | Sudah aktif via URI versioning di bootstrap (`/v1`). |
| JWT authentication | Done | `JwtStrategy`, `JwtAuthGuard`, dan login/refresh endpoint sudah ada. |
| RBAC | Done | CASL guard dan policy check sudah diterapkan. |
| Refresh token flow | Partial | Endpoint refresh ada, tetapi belum ada storage, rotation, atau revocation strategy. |
| Secure cookie/header strategy | Partial | Token masih dikembalikan di body; belum ada pengaturan cookie httpOnly/secure. |
| Request ID | Done | Sudah ada request ID middleware, request context, dan correlation ke log. |
| Idempotency key | Todo | Belum ada mekanisme untuk request sensitif. |
| Validation body/query/path | Done | Sudah ada `ZodValidationPipe`, `UuidSchema`, dan validasi seragam di controller utama. |
| Pagination/filter/sort | Partial | Ada di employee list, belum seragam untuk resource lain. |
| Centralized error handling | Done | Sudah ada exception filter terpusat yang membungkus error ke envelope seragam. |
| Structured logging | Done | Sudah ada logger JSON dengan `requestId` dan `userId`. |
| Transaction boundary | Partial | Sudah ada pada employee create/update, belum menjadi pola baku. |
| Async/event processing | Todo | Belum ada consumer, event id, atau idempotent handler. |
| Rate limiting | Done | Sudah ada global rate limit per IP dan limit lebih ketat untuk login. |
| Timeout/context propagation | Partial | Sudah ada request timeout dan context request, tetapi belum ada cancellation propagation ke DB/async job. |
| Audit log | Done | Sudah ada audit log business-level untuk aksi write penting. |
| Config via env | Done | `ConfigModule.forRoot` dan schema validasi sudah ada. |
| Startup config validation | Done | `validateEnv` menolak env yang tidak valid. |
| Health/readiness endpoint | Done | Sudah ada `/health` dan `/ready`. |
| Swagger/OpenAPI | Partial | Dependency dan flag config ada, tetapi bootstrap dokumentasi belum terlihat. |
| Testing coverage | Partial | Unit dan controller test sudah ada, tetapi belum lengkap untuk production concerns. |
| Graceful shutdown | Done | `enableShutdownHooks()` sudah diaktifkan di bootstrap. |
| Docker-friendly startup | Partial | Dasar konfigurasi ada, tetapi bootstrap masih membaca `process.env` langsung di beberapa tempat. |

## Temuan Utama

1. Fondasi paling kuat saat ini ada di auth, RBAC, validasi env, dan envelope response.
2. Gap terbesar untuk production readiness ada di observability, error handling, healthcheck, rate limit, dan request tracing.
3. Validasi request sudah mulai rapi dengan Zod, tetapi belum menjadi standar global lewat pipe/interceptor yang konsisten.
4. Transaksi sudah diterapkan pada sebagian write flow, namun belum dijadikan pola umum untuk semua operasi yang berisiko partial write.
5. Swagger, healthcheck, dan logging belum terlihat di bootstrap utama, jadi tiga area ini perlu diprioritaskan.

## Target Kondisi Akhir

API dianggap production-ready setelah kondisi berikut terpenuhi:
- Semua response sukses dan error mengikuti kontrak yang konsisten.
- Request yang masuk tervalidasi sebelum menyentuh service logic.
- Error internal tidak bocor ke client dan setiap error punya kode bisnis yang stabil.
- Request bisa dilacak dengan `request_id` dari edge sampai log.
- Endpoint kritikal terlindungi oleh rate limit dan strategi token yang jelas.
- Setiap write flow yang penting memakai transaction boundary yang eksplisit.
- Healthcheck, readiness, dan observability minimum tersedia.
- Dokumentasi API bisa dipakai oleh consumer tanpa membaca source code.

## Roadmap Implementasi

### Fase 1 - Stabilitas Dasar

Prioritas tertinggi. Tujuannya membuat API aman dipakai dan mudah dioperasikan.

1. Tambahkan bootstrap global di `src/main.ts`.
   - Enable CORS dengan konfigurasi dari `AppConfig`.
   - Tambahkan `ValidationPipe` global atau pipe berbasis Zod yang konsisten.
   - Aktifkan `helmet`.
   - Siapkan graceful shutdown hook.
2. Tambahkan centralized exception filter.
   - Map `HttpException` ke format error envelope yang konsisten.
   - Sediakan business error code untuk kasus umum.
   - Pastikan error internal tetap tersembunyi.
3. Tambahkan request ID middleware.
   - Generate `request_id` bila header tidak ada.
   - Propagasi ke response header, log, dan request context.
4. Rapikan startup config handling.
   - Hindari `process.env.PORT` langsung di bootstrap.
   - Gunakan `AppConfig` sebagai source of truth.
   - Hapus log debug seperti `console.log('db config')`.
5. Tambahkan health/readiness endpoint.
   - `/health` untuk liveness.
   - `/ready` untuk cek koneksi database.

### Fase 2 - Contract, Validation, dan Auth Hardening

Tujuannya membuat perilaku API konsisten untuk consumer.

1. Standarisasi response contract untuk semua controller.
   - Pastikan list endpoint mengembalikan `items` + `meta` secara seragam.
   - Samakan format error response.
2. Perluas validasi request.
   - Pastikan body, query, dan path tervalidasi di semua resource.
   - Tambahkan boundary validation untuk limit, page, enum, dan boolean coercion.
3. Finalisasi auth flow.
   - Tentukan strategi refresh token: body, cookie, atau hybrid.
   - Tambahkan mekanisme rotation atau revocation jika diperlukan.
   - Pastikan token expiry dan invalid token path terdokumentasi.
4. Tambahkan versioning strategy.
   - Gunakan `/v1` atau mekanisme Nest versioning.
   - Tetapkan aturan backward-compatible change untuk endpoint publik.
5. Tambahkan Swagger/OpenAPI bootstrap.
   - Dokumentasikan auth, contoh request/response, dan error code.
   - Pastikan dokumentasi mengikuti versioning.

### Fase 3 - Observability dan Abuse Protection

Tujuannya membuat API mudah dipantau dan lebih tahan terhadap misuse.

1. Implement structured logging.
   - Gunakan logger terstruktur dengan level `info`, `warn`, dan `error`.
   - Sertakan `request_id` dan `user_id` bila tersedia.
2. Tambahkan rate limiting.
   - Terapkan limit global per IP.
   - Tambahkan limit yang lebih ketat untuk login dan endpoint sensitif.
3. Tambahkan timeout dan context propagation.
   - Tetapkan timeout untuk request HTTP.
   - Propagasi context untuk operasi async yang lama.
4. Tambahkan audit log business-level.
   - Catat aksi kritikal seperti create/update/delete pada resource sensitif.
   - Simpan siapa yang melakukan aksi, apa yang diubah, dan kapan terjadi.

### Fase 4 - Data Safety dan Consistency

Tujuannya mencegah partial write dan membuat data flow lebih mudah diandalkan.

1. Jadikan transaction boundary sebagai pola baku untuk write flow.
   - Review semua create/update/delete yang melibatkan lebih dari satu write.
   - Pastikan rollback bekerja untuk semua jalur error.
2. Tambahkan idempotency key untuk operasi sensitif.
   - Fokus pada endpoint yang bisa dipanggil ulang oleh client atau gateway.
   - Simpan hasil request duplicate agar efek bisnis tidak terulang.
3. Siapkan pola event processing jika async workflow mulai dipakai.
   - Tambahkan unique event ID.
   - Propagasi `request_id` ke message header.
   - Pastikan consumer idempotent.

### Fase 5 - Testing dan Release Readiness

Tujuannya memastikan perubahan aman dirilis dan dipertahankan.

1. Tambahkan test untuk concern production.
   - Error mapping test.
   - Validation failure test.
   - Healthcheck test.
   - Rate limit test.
   - Idempotency test jika fitur ditambahkan.
2. Tambahkan e2e test untuk alur utama.
   - Login.
   - Refresh token.
   - CRUD resource utama.
   - RBAC deny/allow.
3. Rapikan deployment behavior.
   - Pastikan startup log menandakan readiness.
   - Pastikan shutdown tidak memutus request aktif secara mendadak.
   - Pastikan konfigurasi tetap cocok untuk Docker dan CI/CD.

## Prioritas Implementasi

Urutan kerja yang disarankan:

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4
5. Fase 5

Alasannya:
- Fase 1 menutup risiko paling besar di operasional produksi.
- Fase 2 membuat kontrak API stabil untuk client.
- Fase 3 meningkatkan kemampuan diagnosis dan kontrol abuse.
- Fase 4 memperkuat integritas data dan workflow lanjutan.
- Fase 5 memastikan semua perubahan bisa dipertahankan dalam jangka panjang.

## Catatan Implementasi Repo Saat Ini

- `src/common/http/response.interceptor.ts` sudah menjadi dasar response envelope.
- `src/config/env.schema.ts` sudah memberi validasi env berbasis schema.
- `src/auth/` sudah menyediakan autentikasi JWT dan refresh endpoint.
- `src/common/casl/` sudah menyediakan authorization layer berbasis policy.
- `src/employee/employee.service.ts` sudah menunjukkan pola transaksi yang benar untuk write flow kompleks.
- `src/main.ts` masih terlalu minimal untuk kebutuhan production bootstrap.

## Definisi Selesai

Implementasi dianggap selesai bila:
- checklist prioritas tinggi berubah dari `Todo` / `Partial` menjadi `Done`.
- bootstrap utama sudah mencakup security, validation, logging, dan readiness.
- error response dan success response konsisten di seluruh API.
- healthcheck, Swagger, dan release behavior sudah bisa dipakai di environment production.
