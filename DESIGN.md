# Design Guideline — "Soft Neo-Brutalism"

Panduan desain ini disusun berdasarkan tampilan **YNAcademy**. Gaya ini disebut
**Soft Neo-Brutalism**: kombinasi border hitam tebal ala brutalism, tapi
dilunakkan dengan warna pastel, sudut membulat, dan ilustrasi ikon yang playful.

---

## 1. Prinsip Utama

1. **Border hitam solid** di setiap elemen kunci (card, button, avatar, badge).
2. **Shadow keras (hard shadow)**, bukan blur — memberi efek "kartu terangkat".
3. **Sudut membulat** (`rounded-xl` – `rounded-2xl`), bukan siku tajam ala brutalism klasik.
4. **Warna pastel per kategori/konteks**, bukan satu warna brand tunggal.
5. **Tipografi tebal & besar** untuk angka/heading, teks pendukung abu-abu netral.
6. **Ikon flat dengan outline hitam**, isi warna solid — bukan gradient/3D.

---

## 2. Color Tokens

### Base / Neutral
```css
--color-bg-app: #EDF0FB;        /* background utama konten */
--color-bg-sidebar: #FFFFFF;    /* background sidebar */
--color-bg-surface: #FFFFFF;    /* card putih polos */
--color-border: #1A1A1A;        /* border hitam pekat */
--color-text-primary: #1A1A1A;
--color-text-secondary: #6B7280; /* deskripsi abu-abu */
```

### Accent Pastel (dipakai bergantian per kartu/kategori)
```css
--color-accent-yellow: #FDECC8;   /* card kuning pastel */
--color-accent-yellow-solid: #F5C518; /* nav aktif / CTA */
--color-accent-mint: #DCEFE6;     /* card hijau mint pastel */
--color-accent-mint-solid: #2F8F72;
--color-accent-pink: #FBEAF2;     /* card pink pastel */
--color-accent-pink-solid: #E85A9E;
--color-accent-purple: #E6E3FB;
--color-accent-purple-solid: #6C63D6;
```

> Aturan pakai: 1 aksen pastel = 1 kategori/statistik. Jangan campur lebih dari
> 3–4 aksen dalam satu layar agar tetap harmonis.

---

## 3. Border & Shadow (Hard Shadow Style)

Ciri khas brutalism-nya ada di sini — shadow **tidak blur**, offset tegas ke
kanan-bawah, warna hitam solid.

```css
.card {
  background: var(--color-bg-surface);
  border: 2px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 6px 6px 0px var(--color-border); /* hard shadow, no blur */
}

.card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0px var(--color-border);
  transition: all 0.15s ease;
}
```

Untuk elemen kecil (badge, avatar, tombol), pakai shadow lebih tipis: `3px 3px 0px`.

---

## 4. Tipografi

```css
--font-family: 'Inter', 'Plus Jakarta Sans', sans-serif; /* sans rounded/geometrik */

--text-display: 700 3rem/1.1;   /* angka statistik besar, mis. "2" */
--text-h1: 700 1.75rem/1.3;     /* judul halaman "Statistik" */
--text-h2: 700 1.25rem/1.3;     /* judul card "Kelas Saya" */
--text-body: 500 1rem/1.5;
--text-caption: 400 0.875rem/1.4; color: var(--color-text-secondary);
```

Aturan: heading & angka selalu **bold + hitam pekat**, teks deskripsi selalu
**abu-abu medium**, tidak pernah bold.

---

## 5. Komponen

### 5.1 Sidebar Navigasi
- Background beda dari konten utama (cream vs lavender) — ciptakan pemisahan visual tanpa garis tegas.
- Item aktif: background solid kuning (`--color-accent-yellow-solid`), sudut membulat penuh (`rounded-xl`), teks hitam bold.
- Item non-aktif: transparan, ikon+teks abu-abu gelap.
- Ikon di sidebar: outline style, ukuran ~20–24px.

### 5.2 Stat Card
```
┌───────────────────────────┐
│  [Angka besar]   [Ikon]   │
│                           │
│  Judul (bold)             │
│  Deskripsi (abu-abu kecil)│
└───────────────────────────┘
```
- Background pastel sesuai kategori.
- Ikon di pojok kanan atas, style flat + outline hitam, warna solid dari accent yang sama (bukan pastel).
- Border hitam 2px + hard shadow.

### 5.3 Badge / Tag Kategori (mis. "COMPREHENSIVE")
- Full-bleed di bagian atas card (menempel ke tepi kiri-kanan-atas card).
- Background warna solid (bukan pastel) + teks putih bold uppercase.
- Border-radius hanya di sudut atas (menyatu dengan card di bawahnya).

```css
.badge-tag {
  background: var(--color-accent-pink-solid);
  color: white;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  padding: 8px 16px;
  border-radius: 14px 14px 0 0;
  border: 2px solid var(--color-border);
  border-bottom: none;
}
```

### 5.4 Toggle / Segmented Control (mis. "Sedang dipelajari" / "Sudah diselesaikan")
- Container: pill besar, background putih/abu muda, border hitam tipis.
- Item aktif: background abu gelap/hitam pekat + teks putih.
- Item non-aktif: transparan + teks hitam.

### 5.5 Ikon
- Style: **line-art flat**, stroke hitam ~2px, isi warna solid (bukan pastel, bukan gradient).
- Bentuk playful/sedikit "cute" (buku terbuka, topi wisuda, koin bertumpuk).
- Konsisten ukuran per konteks (ikon card ± 48–56px, ikon sidebar ± 20–24px).

### 5.6 Kartu "Coming Soon" / Empty State
- Background halaman: pola dot subtle di atas warna cream.
- Card putih, border hitam tebal, hard shadow besar (offset lebih jauh, kesan "melayang").
- Ikon fitur: kotak rounded kecil berwarna solid, ikon putih/hitam di dalamnya, disusun list vertikal dengan label di sampingnya.
- Divider dengan ikon "+" bulat hitam di tengah sebagai pemisah section.
- Quote/kutipan di bagian bawah: italic, center-align, atribusi di baris terpisah warna abu-abu.

---

## 6. Spacing & Layout

```css
--radius-card: 16px;
--radius-badge: 14px;
--radius-button: 12px;
--radius-pill: 999px; /* full round untuk nav item & toggle */

--space-card-padding: 24px;
--space-gap-grid: 20px;
```

Grid statistik: 2–3 kolom, gap konsisten `20px`, card persegi cenderung mendekati rasio 1:1.

---

## 7. Checklist Implementasi Cepat

- [ ] Border hitam 2px di semua card/badge/button utama
- [ ] Shadow solid (no blur), offset 4–8px ke kanan-bawah
- [ ] Radius 12–16px (bukan tajam, bukan terlalu bulat/pill kecuali nav & toggle)
- [ ] Satu warna pastel = satu kategori/konteks, konsisten di seluruh app
- [ ] Ikon flat outline hitam + isi solid warna aksen
- [ ] Heading & angka: bold + hitam pekat. Deskripsi: abu-abu medium
- [ ] Hover state: card naik sedikit (`translate`) + shadow membesar

---

## 8. Referensi Palet Cepat (Copy-paste Tailwind Config)

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      bgApp: '#EDF0FB',
      bgSidebar: '#FFFFFF',
      border: '#1A1A1A',
      accent: {
        yellow: '#FDECC8',
        yellowSolid: '#F5C518',
        mint: '#DCEFE6',
        mintSolid: '#2F8F72',
        pink: '#FBEAF2',
        pinkSolid: '#E85A9E',
        purple: '#E6E3FB',
        purpleSolid: '#6C63D6',
      }
    },
    boxShadow: {
      hard: '6px 6px 0px #1A1A1A',
      hardLg: '8px 8px 0px #1A1A1A',
    },
    borderRadius: {
      card: '16px',
    }
  }
}
```

> Catatan: nilai warna di atas adalah estimasi visual dari screenshot referensi,
> silakan sesuaikan dengan brand guideline resmi jika tersedia (mis. dari file Figma).