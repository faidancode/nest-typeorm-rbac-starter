# Phase 2 Implementation

Dokumen ini merangkum hasil pengerjaan fase 2 untuk standardisasi contract dan validasi API.

## Apa yang Sudah Dilakukan

### API versioning diaktifkan di bootstrap

File utama:
- `src/main.ts`

Yang ditambahkan:
- `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`

Fungsi:
- Semua route API sekarang berada di bawah versi URI yang konsisten, yaitu `/v1`.
- Perubahan kontrak API di masa depan bisa dipisahkan ke `/v2` tanpa mematahkan consumer lama.
- Memudahkan dokumentasi, testing, dan rollout bertahap antar versi.

### Zod validation pipe dibuat reusable

File utama:
- `src/common/pipes/zod-validation.pipe.ts`

Yang ditambahkan:
- Pipe generik untuk parsing dan validasi payload dengan Zod.

Fungsi:
- Menghilangkan `Schema.parse(...)` berulang di controller.
- Membuat validasi body dan query konsisten di seluruh module.
- Menjaga controller tetap tipis dan fokus ke orchestration, bukan parsing.

### Schema bersama untuk input umum ditambahkan

File utama:
- `src/common/schemas/common.schemas.ts`
- `src/auth/schemas/auth.schemas.ts`

Yang ditambahkan:
- `UuidSchema` untuk validasi path parameter UUID.
- `LoginSchema` dan `RefreshTokenSchema` untuk request auth yang eksplisit.

Fungsi:
- Menstandarkan validasi input yang dipakai lintas controller.
- Mengurangi penggunaan `any` pada layer auth.
- Menjadikan contract request lebih jelas untuk endpoint login dan refresh.

### Controller utama dirapikan ke pola Zod

File utama:
- `src/auth/controllers/auth.controller.ts`
- `src/department/department.controller.ts`
- `src/position/position.controller.ts`
- `src/user/user.controller.ts`
- `src/employee/employee.controller.ts`
- `src/role/controllers/role.controller.ts`

Yang diubah:
- Validasi body/query dipindahkan ke `ZodValidationPipe`.
- Validasi path `id` dipindahkan ke `UuidSchema`.
- Controller tidak lagi melakukan parsing manual dengan `Schema.parse(...)`.

Fungsi:
- Mengurangi boilerplate validasi.
- Menyamakan perilaku validasi di semua resource utama.
- Membuat error validasi lebih mudah dilacak dan lebih konsisten.

## Dampak Perilaku

Setelah versioning aktif:
- endpoint lama seperti `/auth/login` berubah menjadi `/v1/auth/login`
- endpoint resource seperti `/users` berubah menjadi `/v1/users`
- healthcheck juga ikut ter-versioning jika tidak dikecualikan, sehingga menjadi `/v1/health` dan `/v1/ready`

## Tips And Tricks

1. Gunakan versi baru hanya untuk breaking change.
2. Kalau menambah endpoint baru yang masih kompatibel, tetap taruh di versi yang sama.
3. Hindari memindahkan endpoint tanpa alasan kontrak, karena consumer akan ikut berubah.
4. Saat menambah endpoint baru, pakai `ZodValidationPipe` supaya pola validasi tetap seragam.
5. Untuk path parameter UUID, gunakan `UuidSchema` agar validasi tidak bergantung pada pipe terpisah.
6. Saat nanti menambah Swagger, pastikan server URL dan path mengikuti `/v1`.
7. Kalau butuh endpoint non-versioned untuk probe infra, gunakan controller atau route terpisah yang dibuat `VERSION_NEUTRAL`.

## Catatan

Fase ini mencakup versioning API dan standardisasi validasi request berbasis Zod.
Item fase 2 lain seperti Swagger/OpenAPI, hardening auth flow, dan dokumentasi contract response masih bisa dilanjutkan terpisah.
