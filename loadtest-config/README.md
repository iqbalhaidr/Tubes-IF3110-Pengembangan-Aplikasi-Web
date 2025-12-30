## Pre-requisites

1. **Node.js** (versi 14 atau lebih baru)
2. **K6** - Install dengan cara:
   - Windows: `choco install k6` atau download dari https://k6.io/
   - MacOS: `brew install k6`
   - Linux: `sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list && sudo apt-get update && sudo apt-get install k6`
3. **Database** (MySQL/MariaDB/PostgreSQL) yang sudah berjalan
4. **Aplikasi web** kalian sudah berjalan

## Langkah-langkah Penggunaan

### 1. Install Dependencies

```bash
npm install
```

### 2. Konfigurasi

Copy file konfigurasi contoh dan sesuaikan dengan aplikasi kalian:

```bash
cp k6-config.example.json k6-config.json
```

Edit `k6-config.json` dan sesuaikan dengan aplikasi kalian:

#### a. Base URL
```json
"baseUrl": "http://localhost"
```
Ganti dengan URL aplikasi kalian (misalnya `http://localhost:8000` atau `http://localhost/nimonspedia`)

#### b. Endpoints
Sesuaikan path dan parameter dengan API kalian:
```json
"endpoints": {
  "getAllProducts": {
    "path": "/api/products",
    "method": "GET"
  },
  "getProductsWithRange": {
    "path": "/api/products",
    "params": {
      "priceMin": "min_price",
      "priceMax": "max_price"
    },
    "testValues": {
      "priceMin": 10000,
      "priceMax": 500000
    }
  }
}
```

**Penjelasan:**
- `path`: URL endpoint API kalian
- `params`: Mapping nama parameter (kiri = nama di config, kanan = nama parameter di API kalian)
- `testValues`: Nilai yang akan digunakan saat testing

#### c. Database
```json
"database": {
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "name": "nimonspedia",
  "user": "root",
  "password": "password"
}
```

**Tipe database yang didukung:**
- `mysql` - MySQL
- `mariadb` - MariaDB
- `postgresql` - PostgreSQL

#### d. Schema Database
Sesuaikan nama tabel dan kolom dengan database kalian:

```json
"schema": {
  "tables": {
    "user": "users",
    "store": "stores",
    "product": "products",
    "category": "categories",
    "categoryItem": "category_items"
  },
  "columns": {
    "product": {
      "id": "product_id",
      "name": "product_name",
      "price": "price"
    }
  }
}
```

**PENTING:** Nama tabel dan kolom harus persis sama dengan database kalian (case-sensitive).

#### e. Seeding
```json
"seeding": {
  "enabled": true,
  "productsCount": 10000,
  "categoriesCount": 5,
  "storesCount": 10
}
```

- `productsCount`: Jumlah produk yang akan dibuat (minimal 100, disarankan 10000)
- `categoriesCount`: Jumlah kategori
- `storesCount`: Jumlah toko

#### f. Load Test Configuration
```json
"loadTest": {
  "stages": [
    { "duration": "10s", "target": 20 },
    { "duration": "30s", "target": 50 },
    { "duration": "10s", "target": 20 }
  ]
}
```

**Penjelasan stages:**
- Stage 1: Dalam 10 detik, tingkatkan user virtual dari 0 ke 20
- Stage 2: Dalam 30 detik, tingkatkan user virtual dari 20 ke 50
- Stage 3: Dalam 10 detik, turunkan user virtual dari 50 ke 20

Total durasi: 50 detik

### 3. Validasi Konfigurasi

Sebelum menjalankan test, pastikan konfigurasi kalian benar:

```bash
npm run validate-config
```

**Catatan:** Command di atas adalah shortcut untuk `node validate-config.js`

Jika ada error, perbaiki konfigurasi kalian sesuai petunjuk yang muncul.

### 4. Seed Database

Isi database dengan data testing:

```bash
npm run seed
```

**Catatan:** Command di atas adalah shortcut untuk `node seed-database.js`

Script ini akan:
- Membuat user seller
- Membuat toko untuk setiap seller
- Membuat produk sejumlah `productsCount`
- Mengkategorikan setiap produk

**PENTING:** Pastikan tabel sudah dibuat (jalankan migration terlebih dahulu)!

### 5. Jalankan Load Test

```bash
npm run test
```

**Catatan:** Command di atas adalah shortcut untuk `k6 run load-test.js`

## Membaca Hasil Test

Setelah test selesai, kalian akan melihat laporan seperti ini:

### Thresholds (Batas Performa)

```
getAllProducts_duration
✓ 'avg<6000' avg=4924.343969
✓ 'p(90)<10000' p(90)=9680.99234
✓ 'p(95)<12000' p(95)=10723.014265
```

**Penjelasan:**
- ✓ = Lulus (hijau)
- ✗ = Gagal (merah)
- `avg<6000`: Response time rata-rata harus < 6000ms (6 detik)
- `p(90)<10000`: 90% request harus selesai dalam < 10 detik
- `p(95)<12000`: 95% request harus selesai dalam < 12 detik

### Error Rate

```
getAllProducts_errors: 0.00%  0 out of 281
```

**Target:** Error rate harus < 1% (0.01)

### HTTP Metrics

```
http_req_duration: avg=5.72s min=84.19ms med=3.98s max=35.32s
http_req_failed: 0.00%  0 out of 1040
http_reqs: 1040   17.592946/s
```

**Penjelasan:**
- `http_req_duration`: Waktu response
  - `avg`: Rata-rata
  - `min`: Tercepat
  - `med`: Median
  - `max`: Terlambat
  - `p(90)`, `p(95)`: Persentil 90 dan 95
- `http_req_failed`: Persentase request yang gagal (harus 0%)
- `http_reqs`: Total request dan throughput (request per detik)

### Checks

```
checks_succeeded: 100.00% 1039 out of 1039
```

Harus 100% - semua validasi response berhasil.

## Pertanyaan dan 

Jika ada pertanyaan atau error, silakan tanya langsung ke Nuel. Ingat tidak harus semua metrics pass, selama kalian bisa menganalisa hasilnya dengan baik. Nanti script ini akan dijalankan oleh asisten secara mandiri di vpsnya  agar adil. Tetapi ketika demo silahkan kalian coba jelaskan kenapa ada metrics yang tidak pass dan bagaimana cara memperbaikinya.
