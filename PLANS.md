# Plan Pembaruan UI — Soft Neo-Brutalism

Dokumen ini adalah rencana implementasi untuk menyelaraskan seluruh UI
`react-ticketing` dengan guideline di [`DESIGN.md`](./DESIGN.md). Fokus perubahan
adalah lapisan presentasi; kontrak API, autentikasi, provider/context, WebSocket,
alur booking, dan bentuk data harus tetap kompatibel.

## Status Eksekusi — Selesai 23 Juli 2026

- [x] Token light theme, palet pastel, radius, border, hard shadow, typography,
  focus state, dan reduced-motion diterapkan.
- [x] Primitive UI aktif (button, card, form, badge, table, tabs, modal, drawer,
  sheet, progress, avatar, dan toast) diselaraskan.
- [x] Sidebar, header, navigation aktif, user menu, dan shell halaman admin
  memakai bahasa visual yang sama.
- [x] Seluruh route publik diperbarui: home, login, verifikasi tiket, dan booking.
- [x] Seluruh route admin diperbarui: dashboard, events, seats, editor layout,
  booked seats, tickets, booked table, dan settings.
- [x] Workspace booking/editor mempertahankan zoom, drag, socket, lock,
  multi-ticket, countdown, confirm, invoice, dan `data-testid`.
- [x] Modul dormant `ai-chat` dan `seats-novirtual` diselaraskan tanpa menambah
  route baru.
- [x] Sisa gradient, glassmorphism, backdrop blur, dan dark canvas pada UI aktif
  telah diaudit dan dibersihkan.
- [x] Tampilan mobile dan desktop diperiksa melalui screenshot lokal.
- [x] `npm run build` lulus.
- [x] `npm run lint` lulus tanpa error (peringatan lama non-blocking masih ada).
- [x] Playwright mobile dan desktop lulus: 5 passed, 1 mobile-only test skipped
  pada project desktop.

## 1. Hasil yang Dituju

- Semua halaman aktif memakai bahasa visual Soft Neo-Brutalism yang konsisten:
  border hitam 2 px, hard shadow tanpa blur, radius 12–16 px, warna pastel, dan
  tipografi tebal untuk heading/angka.
- Halaman publik dan admin terasa sebagai satu produk, tanpa sisa tema gelap,
  gradient, glassmorphism, atau shadow blur yang tidak disengaja.
- Status operasional seperti sukses, peringatan, error, kursi tersedia, terkunci,
  dan terisi tetap mudah dibedakan serta tidak bergantung pada warna saja.
- Layout tetap usable pada mobile, tablet, dan desktop, terutama untuk tabel,
  peta kursi, drawer, dialog, dan toolbar yang padat.
- Perubahan style tidak mengubah perilaku bisnis atau locator E2E yang sudah ada.

## 2. Cakupan

### Route aktif

| Kelompok | Route | Halaman |
| --- | --- | --- |
| Publik | `/` | Daftar event |
| Publik | `/login` | Login admin |
| Publik | `/verify-ticket` | Verifikasi PDF tiket |
| Publik | `/booking`, `/booking/:slug` | Pemilihan dan booking kursi |
| Admin | `/dashboard` | Ringkasan dan jadwal war |
| Admin | `/events` | Manajemen event |
| Admin | `/seats` | Daftar/virtualisasi layout kursi |
| Admin | `/seats-layout` | Editor layout kursi |
| Admin | `/booked-seats` | Booking kursi oleh admin |
| Admin | `/tickets` | Data tiket dan goodie bag |
| Admin | `/booked` | Tabel kursi yang sudah dipesan |
| Admin | `/settings` | Import peserta dan pengaturan scanner |

### Komponen lintas halaman

- Shell: sidebar, header, page container, navigation, dan user menu.
- Primitive: button, card, badge, input, textarea, select, checkbox, tabs/toggle,
  table, dialog, drawer, sheet, dropdown, popover, progress, toast, avatar, dan
  tooltip.
- Domain UI: kartu statistik, tabel tiket, tabel booked seats, event cards,
  filter/select, import Excel, ticket chips, legend, seat nodes, panel editor,
  invoice, tutorial, serta semua loading/empty/error/success state.

### Modul halaman yang belum diroute

`pages/ai-chat.tsx` dan `pages/seats-novirtual.tsx` tidak terdaftar di `App.tsx`.
Keduanya tetap diaudit dan dipindahkan ke token baru bila dipertahankan, tetapi
tidak akan ditambahkan ke routing tanpa kebutuhan produk. Komponen demo/tidak
terpakai seperti `section-cards.tsx` dan `data-table.tsx` tidak menjadi acceptance
route; primitive yang mereka pakai tetap ikut memperoleh tema baru.

## 3. Keputusan Desain dan Teknis

1. Tailwind yang dipakai adalah v4, sehingga token guideline diterapkan lewat
   `@theme` dan CSS variables di `src/index.css`, bukan membuat konfigurasi
   `tailwind.config.js` v3.
2. `#EDF0FB` menjadi background konten utama dan `#F3F1F5` menjadi background
   sidebar/panel pendamping. Surface utama tetap putih.
3. Empat keluarga aksen dari guideline dipakai konsisten:
   yellow untuk CTA/aktif, mint untuk sukses/tersedia, pink untuk perhatian atau
   kategori sekunder, dan purple untuk informasi/fitur pendukung.
4. Warna event dari API tidak menjadi tema seluruh layar. Warna tersebut hanya
   dipakai sebagai aksen kecil yang tetap diberi outline hitam dan fallback ke
   palet desain.
5. Warna destruktif dan status kursi ditambahkan sebagai semantic token di luar
   empat aksen, karena keduanya membawa arti operasional. Setiap status juga
   memakai label, ikon, pola, atau bentuk berbeda agar tidak color-only.
6. Plus Jakarta Sans dibundel secara lokal (font package atau asset lokal) dengan
   weight yang benar-benar dipakai. Stack fallback tetap memakai Inter dan
   `sans-serif`.
7. Dark mode tidak diperluas pada pekerjaan ini. Class `dark:` yang tersisa dari
   template dibersihkan pada UI aktif agar tidak menghasilkan dua sistem visual
   yang setengah jadi.
8. Hard shadow hanya diberikan pada container dan aksi utama. Cell tabel, helper
   text, dan elemen sangat kecil cukup memakai border agar layar padat tidak
   terlihat berisik.
9. Hover naik hanya untuk elemen interaktif. Semua transisi menghormati
   `prefers-reduced-motion`, dan focus ring harus tetap terlihat jelas.
10. Tidak diperlukan ilustrasi bitmap baru. Ikon Tabler/Lucide yang sudah ada
    dipakai dengan stroke konsisten 2 px, ukuran seragam, dan solid accent tile.

## 4. Fondasi Visual

### 4.1 Token dan utility global

Target utama: `src/index.css`, `src/main.tsx`, dan package font bila diperlukan.

- Definisikan token dari `DESIGN.md` beserta semantic alias yang dipakai primitive:
  background, foreground, card, popover, primary, secondary, muted, border,
  input, ring, destructive, sidebar, dan chart.
- Tambahkan token radius `button`, `badge`, `card`, `pill`; shadow `hard-sm`,
  `hard`, dan `hard-lg`; spacing card/gap; serta font scale.
- Tambahkan utility reusable untuk:
  - surface brutal (`2px` border + hard shadow);
  - interactive lift;
  - pastel accent variants;
  - dotted cream background untuk empty state;
  - icon tile dengan outline hitam;
  - focus-visible yang kontras;
  - reduced-motion fallback.
- Reset `html`, `body`, dan `#root` ke tinggi minimum penuh dan background app.
- Bersihkan style template Vite di `App.css`; jangan membiarkan `.card` global
  bertabrakan dengan primitive Card.
- Sesuaikan toaster agar memakai surface putih, border hitam, radius, dan hard
  shadow kecil, dengan variant success/error yang tetap semantik.

### 4.2 Primitive bersama

Lakukan sebelum menyentuh halaman agar mayoritas komponen berubah konsisten.

- `Button`: border 2 px, radius button, hard shadow kecil, pressed state yang
  menggeser tombol kembali ke shadow, serta variant default/yellow, secondary,
  outline, ghost, dan destructive.
- `Card`: surface putih, border 2 px, radius 16 px, hard shadow 6 px; sediakan
  accent variant tanpa memaksa setiap pemakai menulis warna manual.
- `Badge`: uppercase untuk kategori, border hitam, solid accent; sediakan status
  variant yang tetap terbaca pada tabel.
- `Input`, `Textarea`, `Select`, `Checkbox`: surface putih, border 2 px, focus
  ring kontras, disabled/error state, dan target sentuh mobile yang memadai.
- `Tabs`/`Toggle`: segmented control berpagar hitam dengan item aktif gelap dan
  teks putih sesuai guideline.
- `Table`: header pastel/cream, divider hitam yang lebih tipis, row hover pastel,
  selected state, serta wrapper scroll yang mempunyai border dan hard shadow.
- `Dialog`, `Drawer`, `Sheet`, `Dropdown`, dan `Popover`: hilangkan glass/blur
  pada panel, gunakan solid surface, border hitam, radius, dan shadow tegas.
- `Progress`, `Avatar`, `Tooltip`, dan `Toast`: selaraskan border, radius, accent,
  dan typography tanpa menambahkan shadow berlebihan.

Acceptance fondasi:

- Komponen yang hanya memakai primitive langsung mendapat tema baru.
- Tidak ada gradient, shadow blur, atau border abu tipis bawaan shadcn pada UI
  aktif kecuali overlay modal dan shadow aksesibilitas/focus.
- Disabled, invalid, loading, hover, active, dan focus-visible dapat dibedakan.

## 5. Shell dan Pola Layout Bersama

Target utama: `app-sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx`,
`site-header.tsx`, `ui/sidebar.tsx`, dan wrapper layout baru bila dibutuhkan.

- Buat satu `AdminShell`/`AdminPage` reusable agar tujuh halaman admin tidak
  mengulang `SidebarProvider`, `AppSidebar`, `SidebarInset`, header, dan padding.
  Provider domain tetap dipasang pada boundary halaman yang membutuhkannya.
- Sidebar memakai background cream. Item aktif ditentukan dari route saat ini,
  memakai yellow solid, border hitam, radius 12 px, dan font bold.
- Item nonaktif tetap transparan dengan ikon outline; hover memakai pastel tanpa
  menggeser layout. State collapsed dan mobile sheet harus tetap bekerja.
- Header memakai background app/surface solid, judul lebih tebal, tombol sidebar
  bergaya icon button, dan pemisahan visual tanpa border abu generik.
- Konten admin memakai lebar/padding responsif yang konsisten. Header halaman
  mempunyai pola title, description, dan action slot yang sama.
- User menu dan dropdown logout mengikuti surface brutal serta tetap dapat
  dinavigasi dengan keyboard.

Acceptance shell:

- Route aktif terlihat jelas setelah reload dan navigasi langsung.
- Sidebar collapsed, shortcut keyboard, dan mobile off-canvas tidak regresi.
- Tidak ada halaman admin dengan margin/header yang berbeda tanpa alasan domain.

## 6. Migrasi per Kelompok Halaman

### Fase A — Halaman publik ringan

#### `/` — Daftar event

- Ganti canvas hitam dengan background lavender dan hero cream/dotted yang
  sederhana; hapus radial gradient/glassmorphism.
- Ubah event menjadi card pastel ber-border hitam dan hard shadow. Gambar event
  berada dalam frame tegas; status menjadi badge solid; tanggal/lokasi memakai
  icon tile.
- CTA “Pesan Kursi” menjadi button yellow. Aksen warna event dibatasi pada strip,
  badge, atau icon tile, bukan gradient tombol.
- Loading menggunakan skeleton brutal; empty state memakai dotted background,
  card putih melayang, ikon tiket, dan pesan yang jelas.
- Grid: satu kolom mobile, dua tablet, tiga desktop; hover lift hanya aktif pada
  perangkat yang mendukung hover.

#### `/login`

- Gunakan background lavender dengan pola dot cream dan card login putih
  ber-hard shadow besar.
- Tambahkan identity block sederhana (ikon tiket + nama aplikasi), perkuat
  hierarki judul/deskripsi, dan pindahkan semua field/button ke primitive baru.
- Pertahankan submit, loading, error, dan redirect yang ada. Hilangkan tautan
  placeholder bila memang tidak mempunyai tujuan.

#### `/verify-ticket`

- Ganti gradient gelap dengan background lavender/cream.
- Drop zone menjadi card dashed hitam dengan accent purple; drag-over memakai
  offset/warna, bukan blur atau glow.
- Buat state parsing, berhasil, gagal, file terpilih, dan reset memakai panel
  pastel yang bentuk/ikonnya berbeda.
- Pertahankan validasi PDF, filter `event_id`, penyimpanan token, toast, dan
  redirect 1,5 detik.

### Fase B — Dashboard dan CRUD admin

#### `/dashboard`

- Ubah `SummaryCards` menjadi stat cards pastel per kategori dengan angka besar,
  badge total, progress bar ber-outline, dan hard shadow.
- Ticket summary table ditempatkan dalam surface brutal yang konsisten.
- “Pengaturan Event” menjadi form card yellow/white dengan input datetime dan CTA
  yang memakai primitive; sediakan loading dan feedback yang stabil.
- Empty dashboard menjadi empty-state card, bukan teks lepas.

#### `/events`

- Gunakan page header bersama dengan CTA “Tambah Event”.
- Bungkus tabel dalam surface brutal; status event dan jadwal war memakai badge
  semantic. Empty/loading state berada di dalam tabel/card.
- Dialog create/edit memakai form grid responsif, label jelas, preview swatch
  warna ber-outline, dan footer action konsisten.
- Ganti `window.confirm` delete dengan AlertDialog yang mempunyai deskripsi target
  event dan aksi destructive yang eksplisit.
- Pada mobile, toolbar menumpuk dengan baik dan tabel dapat discroll horizontal
  tanpa memotong kolom aksi.

#### `/tickets` dan `/booked`

- Samakan pola toolbar: search field dengan label aksesibel, event filter, bulk
  action, dan jumlah hasil.
- Tabel memakai header pastel sticky, badge kategori/gender/status, selected row
  yang jelas, serta pagination/empty/loading bila tersedia.
- Dialog konfirmasi goodie bag memakai card ringkasan dan destructive/cancel
  hierarchy yang benar.
- Pertahankan checkbox selection, filter, update goodie bag, status scan Darisini,
  provider, dan data refresh.

#### `/settings`

- Pecah tampilan menjadi dua section card: “Import Data Peserta” dan “Darisini
  Scanner”, masing-masing dengan icon tile dan deskripsi.
- Restyle native select/file input pada import Excel agar konsisten dengan
  primitive; result import menjadi panel mint/pink yang menampilkan imported dan
  skipped.
- Textarea cookie tetap monospace, mempunyai helper/security copy, serta state
  loading/disabled yang jelas.

### Fase C — Workspace kursi admin

#### `/seats`

- Toolbar event selector dan CTA “Draw Layout” memakai page action bar yang sama.
- Ringkasan total/kategori menjadi pastel chips dengan border hitam; warna seat
  dari data tetap tampil sebagai swatch kecil.
- Virtualized seat grid memakai background lavender/dotted, container ber-border,
  dan node kursi dengan outline hitam serta state hover/selected yang jelas.
- Pastikan virtualisasi, ukuran cell, scroll dua arah, dan pemilihan event tidak
  berubah.

#### `/seats-layout`

- Pertahankan layout tiga panel karena ini workspace produktivitas, tetapi ubah
  left/right panel menjadi cream/white dan canvas menjadi lavender/dotted.
- Beri topbar berisi back action, nama event, save/status bila sudah tersedia,
  dan petunjuk shortcut; jangan menambah operasi backend baru.
- Restyle `SeatCreationTools` dan `SeatPropertiesPanel`: section heading tebal,
  input solid, color swatch ber-outline, CTA yellow/mint, destructive pink/red.
- Seat/decor nodes pada canvas memakai outline tegas; selected/multi-selected,
  drag, resize, rotate, stage, dan snap feedback tidak boleh hanya dibedakan oleh
  shadow/glow.
- Tablet/mobile: panel tools berubah menjadi sheet/drawer atau minimum-width
  workspace dengan pesan orientasi yang jelas; tidak boleh menjadi tiga kolom
  sempit yang tidak dapat dipakai.

#### `/booked-seats`

- Ubah canvas dan toolbar gelap ke lavender/cream solid. Tab Layout/Table memakai
  segmented control sesuai guideline.
- Event/category filter, legend, cart seats, ticket picker, selected ticket chips,
  dan bottom action bar menjadi komponen surface brutal yang konsisten.
- Definisikan seat state:
  - tersedia: mint muda + label/ikon tersedia;
  - dipilih admin: yellow solid + outline lebih tebal;
  - dikunci user lain: purple/pattern + ikon lock;
  - terisi: neutral gray + ikon/check;
  - stage/dekorasi: cream dengan label uppercase.
- Drawer pencarian tiket, dialog konfirmasi, empty search, loading, dan error
  mengikuti primitive baru.
- Pertahankan socket update, pencarian tiket, assignment satu tiket-satu kursi,
  unlock saat tiket dilepas, dan bulk confirm.

### Fase D — Booking publik (risiko tertinggi)

#### `/booking` dan `/booking/:slug`

- Migrasikan shell fullscreen tanpa mengubah urutan flow:
  verifikasi/tambah tiket → pilih sesi tiket aktif → lock kursi → countdown →
  konfirmasi → invoice.
- Desktop event sidebar menjadi panel cream dengan image frame, event detail,
  support/tutorial action, daftar sesi tiket, dan status seat.
- Mobile topbar dan bottom ticket/action bar memakai surface solid ber-border dan
  hard shadow; hilangkan backdrop blur/glow.
- Canvas menjadi lavender/dotted agar seat state kontras. Terapkan semantic seat
  state yang sama dengan admin, tetapi CTA/label dibuat lebih eksplisit untuk
  peserta.
- Countdown lock memakai warning panel yellow dan selalu menampilkan waktu,
  jumlah kursi, serta aksi konfirmasi. Expired state memberi feedback yang jelas.
- Tutorial, verify-ticket dialog/drawer, confirm dialog/drawer, dan invoice
  memakai sistem card/form yang sama; video tetap responsif.
- Pertahankan semua `data-testid`, localStorage token/tutorial state, query/path
  `event_id`, zoom/pan/auto-fit, WebSocket, optimistic state, refresh recovery,
  timeout unlock, multi-ticket, dan invoice.
- Lakukan perubahan dalam batch kecil: shell → sidebar/tickets → canvas/seats →
  overlay/dialog → mobile. Jalankan integration test setelah setiap batch.

### Fase E — Modul dormant dan konsistensi akhir

- Restyle `ai-chat.tsx` dan `seats-novirtual.tsx` dengan token/primitive baru bila
  file tetap dipertahankan; jangan menambah route secara otomatis.
- Audit semua file UI dengan pencarian warna hex, `bg-slate-*`, gradient,
  `backdrop-blur`, `shadow-xl/2xl`, dan border 1 px untuk menemukan visual lama.
- Inline color tetap diperbolehkan hanya untuk warna event/seat dari data.
- Hapus class/style mati yang berasal dari template setelah dipastikan tidak
  dipakai, tanpa membersihkan kode bisnis di luar scope.

## 7. Urutan Implementasi

1. Ambil baseline screenshot dan catat flow kritis sebelum perubahan.
2. Implementasikan token, font, global background, utility, dan primitive.
3. Buat shell/admin page pattern dan migrasikan sidebar/header.
4. Migrasikan halaman publik ringan.
5. Migrasikan dashboard, CRUD event, tabel, dan settings.
6. Migrasikan workspace kursi admin.
7. Migrasikan booking publik dalam batch kecil.
8. Audit modul dormant dan sisa hardcoded visual.
9. Jalankan lint, build, test fungsional, visual review, dan accessibility review.

Urutan ini membuat perubahan berisiko rendah memvalidasi design system terlebih
dahulu sebelum menyentuh booking/WebSocket dan editor drag-and-drop.

## 8. Strategi Verifikasi

### Otomatis

- `npm run lint`
- `npm run build`
- `npm run test:integration`
- Pertahankan test booking yang ada dan locator berikut:
  upload PDF, session ticket, seat status, countdown, refresh lock, timeout,
  confirm booking, invoice, dan konflik dua peserta.
- Tambahkan smoke test route untuk halaman publik dan admin dengan API mock yang
  stabil, minimal memeriksa page heading, primary action, loading/empty/data
  state, serta tidak ada runtime error.
- Tambahkan project Playwright desktop dan mobile; test saat ini hanya mencakup
  Pixel 7 sehingga regresi desktop belum terlindungi.
- Tambahkan screenshot regression pada viewport representatif:
  mobile 412 px, tablet 1024 px, dan desktop 1440 px. Untuk data dinamis, mock
  waktu/API/WebSocket agar screenshot deterministik.

### Manual

- Keyboard-only: sidebar, form, select, dropdown, dialog, drawer, tabel action,
  ticket chip, dan seat selection.
- Focus order dan focus ring tetap terlihat di atas semua warna pastel.
- Zoom 200%, long Indonesian copy, empty data, banyak data, dan nama event panjang.
- Tidak ada horizontal overflow pada halaman biasa; overflow pada canvas/tabel
  harus terkontrol dan disengaja.
- Mobile safe area tidak menutupi bottom action bar.
- Kontras teks memenuhi WCAG AA; teks putih tidak ditempatkan pada pastel muda.
- Test reduced motion, drag/drop PDF, drag/resize seat, zoom/pan, sidebar collapse,
  serta modal/drawer close dengan Escape.

## 9. Definition of Done

- Seluruh route aktif pada tabel cakupan sudah menggunakan token dan pola Soft
  Neo-Brutalism dari `DESIGN.md`.
- Tidak ada visual lama yang kentara pada UI aktif: dark glass panel, gradient
  dekoratif, blurred shadow, atau border abu default.
- Accent color konsisten dan maksimal 3–4 keluarga pada satu layar.
- Semua state utama mempunyai treatment visual: loading, empty, error, success,
  disabled, hover, active, selected, locked, booked, dan expired.
- Responsif dan keyboard navigation lolos pada halaman biasa maupun workspace.
- API call, context/provider, WebSocket, localStorage, query params, dan route
  contract tidak berubah.
- `data-testid` flow booking tetap tersedia.
- Lint, build, dan integration test lulus.
- Visual review desktop/mobile menyatakan tidak ada komponen terpotong, overlap,
  atau kehilangan hard shadow/border utama.

## 10. Batasan Pekerjaan

- Tidak mengubah endpoint/backend, model data, aturan autentikasi, atau business
  logic booking.
- Tidak menambah dark mode, fitur baru, route dormant, maupun operasi penyimpanan
  layout yang belum tersedia.
- Tidak melakukan redesign brand/logo di luar treatment tipografi dan icon tile.
- Tidak menghapus komponen dormant pada fase styling; penghapusan dead code perlu
  keputusan terpisah setelah pemakaian dikonfirmasi.
