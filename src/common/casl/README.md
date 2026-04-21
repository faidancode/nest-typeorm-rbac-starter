# CASL Helper di Project Ini

Folder `src/common/casl` berisi komponen pendukung untuk authorization berbasis CASL. Tujuannya adalah memisahkan logika izin dari controller/service, lalu memakai rule yang konsisten lewat `guard`, `decorator`, dan `ability factory`.

## Fungsi Tiap File

### `action.enum.ts`
Menampung daftar aksi standar yang boleh dipakai di seluruh aplikasi.

Isi saat ini:
- `Manage`
- `Create`
- `Read`
- `Update`
- `Delete`

Gunanya supaya nama aksi konsisten dan tidak tersebar sebagai string bebas di banyak tempat.

### `subjects.ts`
Berisi tipe `Subjects` dan `SubjectObject`.

Fungsi utamanya:
- mendefinisikan resource apa saja yang bisa dipakai oleh CASL
- mengizinkan penggunaan entity class seperti `User`, `Department`, `Employee`, `Position`
- mengizinkan string subject seperti `'user'`, `'department'`, dll
- mendukung object yang diberi penanda `__type`

File ini penting karena CASL perlu tahu objek mana yang sedang diperiksa izin-nya.

### `subject.helper.ts`
Helper kecil untuk membungkus object dengan properti `__type`.

Dipakai saat kamu ingin melakukan check permission pada object biasa, bukan langsung pada entity class.

Contoh fungsi:
- mengubah object menjadi `{ ...object, __type: 'user' }`

Ini membantu `detectSubjectType` di ability factory mengenali subject dengan benar.

### `policies.interface.ts`
Mendefinisikan tipe `PolicyHandler`.

Handler ini bisa berupa:
- function yang menerima `ability`
- object yang punya method `handle(ability)`

Fungsinya adalah membuat format policy fleksibel saat dipasang ke decorator.

### `check-policies.decorator.ts`
Custom decorator untuk menempelkan policy ke controller atau method.

Yang disimpan ke metadata:
- key: `CHECK_POLICIES_KEY`
- value: array `PolicyHandler`

Ini adalah penghubung antara controller dan `PoliciesGuard`.

### `casl-ability.factory.ts`
Komponen inti yang membangun `AppAbility` untuk user tertentu.

Di file ini:
- permission user diambil dari `PermissionRepository`
- permission diubah menjadi rule CASL
- scope permission diterjemahkan jadi condition

Contoh scope yang didukung:
- `all`
- `department`
- `team`
- `own`

File ini adalah tempat utama untuk logika RBAC/ABAC hybrid, karena permission tidak hanya berdasarkan role, tapi juga bisa berdasarkan atribut data.

### `policies.guard.ts`
Guard yang mengeksekusi policy pada request.

Alurnya:
1. ambil policy dari metadata method dan class
2. pastikan user ada di request
3. buat ability lewat `CaslAbilityFactory`
4. simpan ability ke `request`
5. jalankan semua policy handler
6. tolak request jika ada yang tidak lolos

Ini adalah gatekeeper authorization di layer HTTP.

### `request-with-ability.ts`
Menambah tipe `Request` Express dengan properti `ability`.

Gunanya supaya setelah `PoliciesGuard` berjalan, controller/service bisa membaca `request.ability` tanpa error typing.

### `casl.module.ts`
Module NestJS untuk mengemas semua provider CASL.

Saat ini module ini:
- mengimpor `RoleModule`
- menyediakan `CaslAbilityFactory`
- menyediakan `PoliciesGuard`

Jika fitur authorization dipakai di banyak module, cukup export dari sini lalu import `CaslModule`.

---

## Urutan Pembuatan yang Disarankan

Kalau mau membangun CASL dari nol, urutan yang paling aman biasanya seperti ini:

1. `action.enum.ts`
   - tentukan daftar aksi dulu
   - ini jadi kontrak dasar untuk semua permission

2. `subjects.ts`
   - definisikan resource/subject yang boleh dipakai
   - pastikan entity class dan string subject yang dipakai sinkron

3. `policies.interface.ts`
   - tetapkan bentuk policy handler
   - ini penting sebelum membuat decorator dan guard

4. `subject.helper.ts`
   - siapkan helper kalau nanti ada object runtime yang perlu diberi identitas subject

5. `casl-ability.factory.ts`
   - bangun aturan permission dari data user
   - isi mapping `scope -> condition`

6. `check-policies.decorator.ts`
   - buat decorator untuk menempelkan policy ke controller/method

7. `policies.guard.ts`
   - eksekusi policy dan hentikan request jika tidak lolos

8. `request-with-ability.ts`
   - rapikan typing request agar ability bisa dipakai ulang

9. `casl.module.ts`
   - bungkus semuanya ke dalam module NestJS

Urutan ini membantu karena tiap file punya dependency yang jelas. Misalnya, decorator dan guard butuh tipe policy, sedangkan factory butuh action dan subject yang sudah stabil.

---

## Tips dan Trik Penggunaan CASL sebagai RBAC Helper

### 1. Simpan permission dalam format yang konsisten
Kalau permission disimpan sebagai string, pakai format tetap seperti:

```ts
resource.action
```

Contoh:
- `user.read`
- `employee.update`
- `department.delete`

Di factory, format ini mudah di-split menjadi `resource` dan `action`.

### 2. Gunakan scope untuk membuat RBAC lebih fleksibel
RBAC murni sering terlalu kasar. Scope seperti ini lebih praktis:

- `all`
- `department`
- `team`
- `own`

Dengan begitu, role yang sama bisa punya batasan data berbeda.

### 3. Bedakan subject class dan subject object runtime
Kalau kamu cek permission ke entity hasil query, pastikan subject-nya bisa dikenali CASL.

Trik yang berguna:
- pakai entity class saat rule sifatnya generik
- pakai `subject.helper.ts` saat object runtime perlu label `__type`

### 4. Simpan ability ke request sekali saja
Di `PoliciesGuard`, ability sudah disimpan ke `request.ability`.

Ini bagus karena:
- controller tidak perlu rebuild ability
- service lain bisa reuse hasil yang sama
- mengurangi query dan logika duplikat

### 5. Buat policy di level class kalau banyak method memakai rule yang sama
Kalau satu controller punya banyak endpoint dengan policy yang mirip, pasang decorator di class level lalu override di method tertentu jika perlu.

Ini membuat controller lebih rapi.

### 6. Kombinasikan `can` dan `cannot`
CASL mendukung allow dan deny rule.

Praktiknya:
- gunakan `can` untuk akses default
- gunakan `cannot` untuk pengecualian spesifik

Ini membantu kalau ada role yang hampir sama, tapi ada beberapa aksi yang harus diblok.

### 7. Jaga `detectSubjectType` tetap sesuai sumber data
Di factory ini, subject dideteksi dari:
- `__type`
- `constructor.name`

Kalau data yang dikirim ke CASL berupa plain object, pastikan ada penanda yang konsisten. Kalau tidak, rule bisa gagal cocok.

### 8. Jangan hardcode role logic di controller
Controller sebaiknya hanya deklaratif:

- pasang decorator policy
- biarkan guard dan factory menangani evaluasi izin

Dengan begitu, authorization logic tetap terpusat.

### 9. Uji kombinasi permission, bukan hanya role
Karena logic di sini memakai permission dan scope, test yang perlu disiapkan bukan hanya:
- role admin bisa akses

tapi juga:
- role staff hanya bisa `own`
- department A tidak bisa akses department B
- update boleh, delete tidak boleh

### 10. Dokumentasikan pasangan `action` dan `subject`
Saat project makin besar, daftar aksi dan subject akan bertambah.

Lebih aman kalau setiap penambahan permission langsung diikuti dokumentasi kecil agar tidak ada string liar yang tersebar di codebase.

---

## Alur Pakai Singkat

1. User login dan punya `id`, `departmentId`, `teamId`
2. `PoliciesGuard` membaca policy dari controller/method
3. `CaslAbilityFactory` mengambil permission user
4. Rule CASL dibangun dari `action`, `subject`, dan `scope`
5. Guard mengecek policy
6. Jika lolos, request lanjut

---

## Catatan Penting

- Pastikan `permission.action` memang konsisten dengan format yang diharapkan factory.
- Kalau subject baru ditambahkan, update juga `subjects.ts`.
- Kalau scope baru ditambahkan, update `buildConditions()` di `casl-ability.factory.ts`.
- Kalau format policy handler berubah, update `policies.interface.ts` dan decorator/guard sekaligus.

