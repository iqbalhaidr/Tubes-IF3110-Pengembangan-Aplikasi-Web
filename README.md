# Nimonspedia, E-Commerce Web Application

## Deskripsi Aplikasi Web

Nimonspedia adalah aplikasi web e-commerce yang dikembangkan menggunakan teknologi web dasar (PHP, JavaScript, HTML, dan CSS) tanpa framework. Aplikasi ini menyediakan platform jual-beli online yang menghubungkan penjual (seller) dan pembeli (buyer) dalam satu ekosistem digital.

Aplikasi ini memiliki dua role pengguna utama:

**Buyer (Pembeli)**
- Dapat menjelajahi dan mencari produk dari berbagai toko
- Melihat detail produk lengkap dengan deskripsi dan informasi stok
- Menambahkan produk ke shopping cart
- Melakukan checkout dengan sistem balance virtual
- Melakukan top-up balance untuk pembelian
- Melihat riwayat pembelian dan status pengiriman
- Mengkonfirmasi penerimaan barang

**Seller (Penjual)**
- Mengelola toko online dengan informasi lengkap (nama, deskripsi, logo)
- Menambah, mengedit, dan menghapus produk (soft delete)
- Menerima dan memproses order dari buyer
- Menyetujui atau menolak order dengan alasan
- Mengatur waktu pengiriman barang
- Melihat balance toko yang bertambah setelah order selesai

Aplikasi ini dibangun dengan memperhatikan aspek keamanan (password hashing, validasi input, XSS prevention), responsivitas, dan user experience (loading states, error handling, toast notifications). Sistem autentikasi menggunakan session-based authentication, dan data disimpan dalam relational database (PostgreSQL) dengan file gambar disimpan di local file system.

## Daftar Requirement

### Technology Stack

#### Frontend
- **HTML5** - Struktur halaman web
- **CSS** - Styling dan layout
- **JavaScript** - Client-side logic dan interaksi

#### Backend
- **PHP** - Server-side scripting 
- **PostgreSQL** - Relational database management system

#### Development Tools
- **Docker & Docker Compose** - Containerization untuk development dan deployment
- **Quill.js** - Rich text editor untuk deskripsi produk dan toko
- **PDO (PHP Data Objects)** - Database abstraction layer untuk query database

### Server Requirements
- PHP 8.0 atau lebih tinggi
- PostgreSQL 15 atau lebih tinggi
- Web Server (Apache/Nginx melalui Docker)
- Docker Engine 20.10 atau lebih tinggi
- Docker Compose 2.0 atau lebih tinggi

### Browser Requirements
- Google Chrome (versi terbaru)
- Mozilla Firefox (versi terbaru)
- Safari (versi terbaru)
- Microsoft Edge (versi terbaru)
- JavaScript harus diaktifkan

### External Libraries
- **Quill.js** - Rich text editor


## Cara Instalasi

### Prerequisites
Pastikan Docker sudah terinstall di sistem Anda:

### Langkah Instalasi

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd nimonspedia
   ```

2. **Setup Environment Variables**
   
   Buat file `.env` di root directory project dengan konfigurasi berikut:
   ```env
   # Database Configuration
   DB_HOST=db
   DB_PORT=5432
   DB_NAME=nimonspedia_db
   DB_USER=nimonspedia_user
   DB_PASSWORD=your_strong_password_here
   
   # Application Configuration
   APP_ENV=development
   APP_URL=http://localhost:8080
   
   # Session Configuration
   SESSION_LIFETIME=86400
   SESSION_NAME=NIMONSPEDIA_SESSION
   
   # Security
   SESSION_COOKIE_HTTPONLY=true
   SESSION_COOKIE_SAMESITE=Lax
   ```
   
   **Catatan:** Ganti `your_strong_password_here` dengan password anda yang kuat untuk database.

3. **Build dan Start Container**
   ```bash
   docker-compose up -d --build
   ```

4. **Akses Aplikasi**
   
   Buka browser dan akses:
   ```
   http://localhost:8080
   ```

## Cara Menjalankan Server

### Development Mode

Setelah instalasi selesai, untuk menjalankan server dalam mode development:

1. **Start Server**
   ```bash
   docker-compose up
   ```
   
   Atau untuk menjalankan di background:
   ```bash
   docker-compose up -d
   ```

2. **Akses Aplikasi**
   
   Aplikasi akan berjalan di:
   - **URL:** http://localhost:8080
   - **Database:** localhost:5432

3. **Stop Server**
   ```bash
   docker-compose stop
   ```

4. **Restart Server**
   ```bash
   docker-compose restart
   ```

5. **Stop dan Remove Containers**
   ```bash
   docker-compose down
   ```

## Tangkapan Layar Aplikasi

### Halaman Autentikasi

| Halaman | Screenshot | Google Lighthouse Skor |
|---------|------------|-----------|
| **Login (Buyer & Seller)** | <img src="./public/image_readme/login.png" width="300"> | <img src="./public/lighthouse-images/login.png" width="300">|
| **Register (Buyer & Seller)** | <img src="./public/image_readme/register-buyer.png" width="300"><br><img src="./public/image_readme/register-seller.png" width="300"><br>*Atas: Buyer, Bawah: Seller* | <img src="./public/lighthouse-images/register.png" width="300">|

### Halaman Buyer

| Halaman | Screenshot | Google Lighthouse Skor |
|---------|------------|-----------|
| **Product Discovery / Home** | <img src="./public/image_readme/home.png" width="300"> | <img src="./public/lighthouse-images/home.png" width="300">|
| **Detail Produk** | <img src="./public/image_readme/product-detail.png" width="300"> |<img src="./public/lighthouse-images/product-detail.png" width="300"> |
| **Detail Store** | <img src="./public/image_readme/store-detail.png" width="300">  | <img src="./public/lighthouse-images/store-detail.png" width="300">|
| **Shopping Cart** | <img src="./public/image_readme/cart.png" width="300">  | <img src="./public/lighthouse-images/shopping-cart.png" width="300">|
| **Checkout** | <img src="./public/image_readme/checkout.png" width="300">  | <img src="./public/lighthouse-images/checkout.png" width="300">|
| **Order History** | <img src="./public/image_readme/order-history.png" width="300">  | <img src="./public/lighthouse-images/home.png" width="300">|
| **Profile** | <img src="./public/image_readme/profile.png" width="300">  | <img src="./public/lighthouse-images/profile.png" width="300">|

### Halaman Seller

| Halaman | Screenshot | Google Lighthouse Skor |
|---------|------------|-----------|
| **Dashboard** | <img src="./public/image_readme/dashboard.png" width="300">  | <img src="./public/lighthouse-images/dashboard.png" width="300">|
| **Product Management** | <img src="./public/image_readme/product-management.png" width="300">  | <img src="./public/lighthouse-images/product-management.png" width="300">|
| **Add Product** | <img src="./public/image_readme/add-product.png" width="300">  | <img src="./public/lighthouse-images/add-product.png" width="300">|
| **Edit Product** | <img src="./public/image_readme/edit-product.png" width="300">  | <img src="./public/lighthouse-images/edit-product.png" width="300">|
| **Order Management** | <img src="./public/image_readme/order-management.png" width="300">  | <img src="./public/lighthouse-images/order-management.png" width="300">|

### Implementasi Bonus

| Spesifikasi | Status |
|------------|--------|
| **All Responsive Web Design** | ✅ Implemented |
| **UI/UX Seperti Tokopedia** | ✅ Implemented |
| **Data Export** | ✅ Implemented |
| **Advanced Search** | ✅ Implemented |
| **Google Lighthouse** | ✅ Implemented |

## Perbaikan Google Lighthouse

Berikut adalah daftar perbaikan aksesibilitas dan performa yang dilakukan berdasarkan hasil audit Google Lighthouse:

### 1. **main.css**
- **Masalah:** Kontras warna pada navbar links dan balance display tidak memenuhi standar WCAG 2.1 Level AA
- **Perbaikan:** 
  - Menambahkan `.sr-only` class untuk teks yang hanya dapat diakses oleh screen reader
  - Meningkatkan opacity background dari 0.18 menjadi 0.25 pada balance display
  - Menambahkan `color: var(--white)` dan `opacity: 1` untuk memastikan kontras minimum 4.5:1

### 2. **balance.js**
- **Masalah:** Top-up modal buttons memiliki aria-hidden pada container tapi tetap fokusable oleh keyboard
- **Perbaikan:**
  - Menambahkan `aria-modal="true"` dan `role="dialog"` pada backdrop
  - Menggunakan `inert=""` attribute untuk mencegah keyboard access saat modal tertutup
  - Mengelola `aria-hidden` state secara dinamis saat modal dibuka/ditutup

### 3. **register.php & register.js**
- **Masalah:** ARIA roles tidak sesuai standar WAI-ARIA untuk tab pattern (tombol punya `aria-selected` tapi tidak punya `role="tab"`)
- **Perbaikan:**
  - Menambahkan `role="tab"` pada semua tab buttons
  - Menambahkan `role="tablist"` pada container
  - Menambahkan `aria-controls` untuk linking tabs dengan panels
  - Mengelola `tabindex` secara dinamis (0 untuk active, -1 untuk inactive)

### 4. **product_detail.php**
- **Masalah:** Quantity input field tidak memiliki associated label yang properly
- **Perbaikan:**
  - Menambahkan `<label class="sr-only">` untuk quantity input
  - Menambahkan `aria-label` pada increment/decrement buttons

### 5. **product_management.php**
- **Masalah:** Select elements (kategori filter, sorting) tidak memiliki associated labels
- **Perbaikan:**
  - Menambahkan 3 sr-only labels untuk search input, category filter, dan sort filter
  - Labels: "Cari nama produk", "Filter berdasarkan kategori", "Urutkan produk"

### 6. **product_management.css**
- **Masalah 1:** Price cells menampilkan warna hardcoded #03ac0e, tidak konsisten dengan CSS variables
  - **Perbaikan:** Mengubah ke `color: var(--primary-green)` untuk konsistensi
- **Masalah 2:** Delete button text color (#ef4444) terlalu terang, kontras kurang dari 4.5:1
  - **Perbaikan:** Mengubah text color menjadi #b91c1c (dark red) mencapai 4.53:1 kontras pada light pink background

### 7. **seller_edit_product.js & add_product.js**
- **Masalah:** Quill editor toolbar buttons tidak memiliki accessible names untuk screen reader
- **Perbaikan:**
  - Menambahkan dynamic `aria-label` attributes pada semua toolbar buttons
  - Labels: "Tebal", "Miring", "Garis bawah", "Daftar bernomor", "Daftar poin"
  - Menggunakan setTimeout untuk memastikan Quill render sebelum menambahkan labels

### 8. **orders.css**
- **Masalah:** Layout shift culprits - terjadi pergerakan halaman saat data loading, pagination berubah, atau tab counts update
- **Perbaikan:**
  - Menambahkan `min-height: 400px` pada `.orders-section` untuk reserved space
  - Menambahkan `min-height: 52px` pada `.pagination-container` untuk prevent shift
  - Menambahkan `min-height: 44px` pada `.status-tabs` untuk maintain tab height
  - Menambahkan `min-height: 400px` dan flexbox centering pada `.empty-state` dan `.loading-state`

### 9. **profile.php & profile-edit.js**
- **Masalah:** Edit profile form tidak memiliki confirmation modal dan email field tidak visible
- **Perbaikan:**
  - Menambahkan email field (read-only) pada edit profile form
  - Menambahkan confirmation modal untuk edit profile (sama seperti password change flow)
  - Menambahkan "Change Password" link dalam edit profile form untuk kemudahan navigasi
  - Menambahkan `.btn-link` CSS class untuk styling tombol link

## Pembagian Tugas

### Server-side (Backend)

| Halaman | Pengembang |
|---------|------------|
| Login | 13523109 |
| Register | 13523109 |
| Product Discovery / Home | 13523095, 13523109 |
| Detail Produk | 13523095 |
| Detail Store | 13523095 |
| Shopping Cart | 13523111 |
| Checkout | 13523111 |
| Order History | 13523109, 13523111 |
| Profile | 13523109 |
| Dashboard (Seller) | 13523109 |
| Product Management | 13523095 |
| Add Product | 13523095 |
| Edit Product | 13523095 |
| Order Management | 13523109, 13523111 |

### Client-side (Frontend)

| Halaman | Pengembang |
|---------|------------|
| Login | 13523109 |
| Register | 13523109 |
| Product Discovery / Home | 13523095, 13523109 |
| Detail Produk | 13523095 |
| Detail Store | 13523095 |
| Shopping Cart | 13523111 |
| Checkout | 13523111 |
| Order History | 13523109, 13523111 |
| Profile | 13523109 |
| Dashboard (Seller) | 13523109 |
| Product Management | 13523095 |
| Add Product | 13523095 |
| Edit Product | 13523095 |
| Order Management | 13523109, 13523111 |

## Contributors

| Nama | NIM |
|------|-----|
| Rafif Farras | 13523095 | 
| Haegen Quinston | 13523109 | 
| Muhammad Iqbal Haidar | 13523111 | 

## Lisensi

Project ini dibuat untuk memenuhi Tugas Besar Milestone 1 IF3110 Pengembangan Aplikasi Berbasis Web 2025/2026.

---

**Copyright © 2025 Kelompok [Nama Kelompok] - Institut Teknologi Bandung**