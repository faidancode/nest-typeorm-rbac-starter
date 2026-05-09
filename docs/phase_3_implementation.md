# Phase 3 Implementation

Dokumen ini merangkum hasil pengerjaan fase 3 untuk observability dan abuse protection.

## Apa yang Sudah Dilakukan

### 1. Structured logging ditambahkan

File utama:
- `src/common/logging/app-logger.service.ts`
- `src/common/logging/logging.module.ts`
- `src/common/logging/request-logging.interceptor.ts`
- `src/common/http/http-exception.filter.ts`

Yang ditambahkan:
- Logger berbasis `winston` dengan output JSON.
- Field log otomatis untuk `requestId` dan `userId`.
- Log request sukses dengan metadata seperti method, path, status code, duration, dan IP.
- Log error terstruktur untuk validation error, `HttpException`, dan error tak terduga.

Fungsi:
- Membuat log mudah diproses oleh platform observability.
- Memudahkan tracing satu request dari awal sampai akhir.
- Menyediakan konteks yang cukup saat debugging production issue.

### 2. Request ID dan user ID correlation diperkuat

File utama:
- `src/common/context/request-context.service.ts`
- `src/common/middleware/request-id.middleware.ts`
- `src/common/logging/request-logging.interceptor.ts`

Yang ditambahkan:
- `requestId` tetap digenerate dari edge.
- `userId` disimpan ke request context setelah auth guard berhasil.
- Context ini dipakai oleh logger dan audit log.

Fungsi:
- Menghubungkan request log, error log, dan audit log ke satu identifier yang sama.
- Memudahkan investigasi lintas service dan lintas layer.

### 3. Rate limiting ditambahkan

File utama:
- `src/common/rate-limit/rate-limit.service.ts`
- `src/common/rate-limit/rate-limit.module.ts`
- `src/common/middleware/rate-limit.middleware.ts`

Yang ditambahkan:
- Rate limit global per IP.
- Rate limit lebih ketat untuk endpoint login.
- Header response seperti `x-rate-limit-limit`, `x-rate-limit-remaining`, dan `x-rate-limit-reset`.
- Bypass untuk endpoint health/readiness.

Fungsi:
- Mengurangi risiko abuse dan brute-force.
- Menahan traffic berlebihan sebelum mencapai service logic.

Catatan:
- Implementasi ini masih in-memory, jadi cocok untuk single-instance atau starter project.
- Jika nanti dijalankan di banyak instance, rate limit sebaiknya dipindah ke shared store seperti Redis.

### 4. Request timeout ditambahkan

File utama:
- `src/common/middleware/request-timeout.middleware.ts`
- `src/config/env.schema.ts`
- `src/config/app.config.ts`

Yang ditambahkan:
- Timeout request configurable lewat `REQUEST_TIMEOUT_MS`.
- Jika request melewati batas waktu, API mengembalikan `503 REQUEST_TIMEOUT`.

Fungsi:
- Mencegah request menggantung terlalu lama.
- Membantu menjaga resource server tetap sehat saat ada handler lambat.

### 5. Audit log business-level ditambahkan

File utama:
- `src/common/logging/audit.service.ts`
- `src/department/department.service.ts`
- `src/position/position.service.ts`
- `src/user/user.service.ts`
- `src/role/services/role.service.ts`
- `src/employee/employee.service.ts`

Yang ditambahkan:
- Audit event untuk aksi `create`, `update`, `delete`, dan `assign_permissions`.
- Audit log menyimpan resource, resourceId, actorId, requestId, before, dan after bila tersedia.

Fungsi:
- Memberi jejak bisnis untuk aksi-aksi penting.
- Membantu investigasi perubahan data dan aktivitas user.

## Tips And Tricks

1. Kalau menambah endpoint write baru, panggil `AuditService.record()` di titik commit yang paling aman.
2. Untuk data sensitif, audit cukup simpan field penting, bukan seluruh payload mentah.
3. Kalau nanti aplikasi dipasang di multi-instance, pindahkan rate limit ke shared storage agar konsisten antar pod.
4. Gunakan `requestId` sebagai correlation key saat membaca log dan audit log.
5. Kalau ada endpoint yang memang panjang prosesnya, pertimbangkan menaikkan `REQUEST_TIMEOUT_MS` secara selektif, bukan global.
6. Jika ingin menambah log baru, gunakan `AppLoggerService` supaya format tetap JSON dan otomatis membawa context request.

## Catatan

Fase 3 ini sudah mencakup observability minimum dan protection dasar.
Fase berikutnya masih bisa fokus ke hardening data consistency, idempotency, dan testing production behavior.

