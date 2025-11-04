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