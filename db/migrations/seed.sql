INSERT INTO category (category_name) VALUES ('Olahraga');

INSERT INTO "user" (name, email, password_hash, role, balance, address) VALUES
('Budi Santoso', 'budi.seller@example.com', 'password_terenkripsi', 'SELLER', 1000000, 'Jl. Merdeka 1, Jakarta'),
('Citra Lestari', 'citra.seller@example.com', 'password_terenkripsi', 'SELLER', 500000, 'Jl. Sudirman 2, Jakarta'),
('Dedi Wijaya', 'dedi.seller@example.com', 'password_terenkripsi', 'SELLER', 750000, 'Jl. Pahlawan 3, Surabaya'),
('Eka Putri', 'eka.seller@example.com', 'password_terenkripsi', 'SELLER', 200000, 'Jl. Asia Afrika 4, Bandung'),
('Fajar Nugroho', 'fajar.seller@example.com', 'password_terenkripsi', 'SELLER', 300000, 'Jl. Gajah Mada 5, Semarang'),
('Gita Permata', 'gita.seller@example.com', 'password_terenkripsi', 'SELLER', 150000, 'Jl. Diponegoro 6, Yogyakarta'),
('Haris Maulana', 'haris.seller@example.com', 'password_terenkripsi', 'SELLER', 450000, 'Jl. Kartini 7, Medan'),
('Indah Cahyani', 'indah.seller@example.com', 'password_terenkripsi', 'SELLER', 800000, 'Jl. Thamrin 8, Makassar'),
('Jaya Kusuma', 'jaya.seller@example.com', 'password_terenkripsi', 'SELLER', 250000, 'Jl. Gatot Subroto 9, Denpasar'),
('Kartika Dewi', 'kartika.seller@example.com', 'password_terenkripsi', 'SELLER', 600000, 'Jl. Siliwangi 10, Bogor'),
('Lina Marlina', 'lina.buyer@example.com', 'password_terenkripsi', 'BUYER', 5000000, 'Jl. Pembeli 1, Jakarta'),
('Mega Utami', 'mega.buyer@example.com', 'password_terenkripsi', 'BUYER', 10000000, 'Jl. Pembeli 2, Bandung'),
('Nina Kirana', 'nina.buyer@example.com', 'password_terenkripsi', 'BUYER', 7500000, 'Jl. Pembeli 3, Surabaya'),
('Oscar Pranata', 'oscar.buyer@example.com', 'password_terenkripsi', 'BUYER', 2000000, 'Jl. Pembeli 4, Yogyakarta'),
('Rina Hartati', 'rina.buyer@example.com', 'password_terenkripsi', 'BUYER', 3000000, 'Jl. Pembeli 5, Medan');

INSERT INTO store (user_id, store_name, store_description, store_logo_path) VALUES
(1, 'Budi Elektronik', 'Menjual barang elektronik ori dan bergaransi.', 'public/images/store-logos/1.jpg'),
(2, 'Citra Fashion', 'Fashion wanita terkini dan termurah.', 'public/images/store-logos/2.jpg'),
(3, 'Toko Buku Dedi', 'Menjual buku fiksi, non-fiksi, dan komik.', 'public/images/store-logos/3.jpg'),
(4, 'Dapur Eka', 'Perlengkapan dapur dan rumah tangga modern.', 'public/images/store-logos/4.png'),
(5, 'Fajar Sport', 'Alat olahraga dan jersey original.', 'public/images/store-logos/5.png'),
(6, 'Gita Gadget', 'Gadget terbaru, smartphone, dan aksesoris.', 'public/images/store-logos/6.png'),
(7, 'Haris Pakaian Pria', 'Spesialis pakaian pria kasual dan formal.', 'public/images/store-logos/7.png'),
(8, 'Indah Perabot', 'Furniture minimalis dan dekorasi rumah.', 'public/images/store-logos/8.png'),
(9, 'Jaya Olahraga', 'Pusat alat fitness dan olahraga outdoor.', 'public/images/store-logos/9.png'),
(10, 'Warung Buku Kartika', 'Menjual buku lokal dan impor.', 'public/images/store-logos/10.png');

INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(1, 'TV LED 50 inch Smart 4K', 'TV 4K dengan OS Android, Netflix ready.', 4500000, 20),
(1, 'Laptop Gaming Core i7', 'Laptop gaming 16GB RAM, RTX 4060.', 15000000, 10),
(1, 'Kipas Angin Berdiri', 'Kipas angin 16 inch, 3 kecepatan.', 250000, 50),
(1, 'Blender Multifungsi', 'Blender jus dan bumbu kering.', 300000, 30);
INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(2, 'Kemeja Batik Wanita', 'Kemeja batik katun primisima, lengan panjang.', 180000, 40),
(2, 'Gaun Pesta Brokat', 'Gaun pesta mewah bahan brokat import.', 750000, 15),
(2, 'Celana Kulot Jeans', 'Celana kulot high-waist bahan jeans.', 220000, 50),
(2, 'Jaket Kulit Sintetis', 'Jaket motor bahan kulit sintetis premium.', 350000, 25);
INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(3, 'Novel "Laskar Pelangi" - Andrea Hirata', 'Novel bestseller edisi soft cover.', 85000, 100),
(3, 'Buku Resep Masakan Rumahan', 'Kumpulan resep masakan nusantara.', 120000, 60),
(3, 'Komik "One Piece" Vol. 100', 'Komik One Piece volume 100 edisi Indo.', 45000, 200),
(3, 'Sejarah Dunia Yang Disembunyikan', 'Buku sejarah kontroversial.', 150000, 30);
INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(4, 'Panci Set Stainless (5 pcs)', 'Panci set anti lengket dan anti karat.', 450000, 40),
(4, 'Pisau Dapur Chef (Set)', 'Set pisau dapur 5 pcs + 1 gunting.', 200000, 70),
(4, 'Rice Cooker Digital 1.8L', 'Rice cooker digital low-carb.', 600000, 25),
(4, 'Oven Listrik 20L', 'Oven listrik low-watt untuk kue.', 800000, 15);
INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(5, 'Sepatu Lari Pria Original', 'Sepatu lari nyaman dan ringan.', 750000, 30),
(5, 'Raket Badminton Carbon', 'Raket badminton full carbon, bonus senar.', 500000, 20),
(5, 'Bola Basket Kulit PU', 'Bola basket ukuran 7, bahan PU.', 250000, 50),
(5, 'Matras Yoga Anti-Slip', 'Matras yoga TPE 6mm, anti-slip.', 180000, 60);
INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(6, 'Smartphone Flagship Pro', 'Smartphone 12GB RAM, kamera 108MP.', 12000000, 15),
(6, 'Powerbank 20000mAh Fast Charging', 'Powerbank 20000mAh PD 25W.', 350000, 100),
(6, 'TWS Earbuds v5.3', 'Earbuds TWS Bluetooth 5.3, low latency.', 450000, 80),
(6, 'Smartwatch Pro GPS', 'Smartwatch dengan GPS dan Heart Rate monitor.', 1500000, 40);
INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(7, 'Kaos Polos Katun Combed 30s', 'Kaos polos katun combed 30s, warna hitam.', 75000, 200),
(7, 'Celana Chino Pria Slimfit', 'Celana chino bahan katun stretch.', 190000, 100),
(7, 'Hoodie Zipper Polos', 'Hoodie zipper bahan fleece tebal.', 230000, 70),
(7, 'Kemeja Flanel Lengan Panjang', 'Kemeja flanel motif kotak.', 170000, 50);
INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(8, 'Lampu Belajar LED Meja', 'Lampu meja LED 3 mode warna.', 130000, 60),
(8, 'Meja Lipat Laptop Kayu', 'Meja laptop lipat portable.', 90000, 80),
(8, 'Rak Sepatu 5 Susun', 'Rak sepatu besi 5 susun.', 150000, 40),
(8, 'Cermin Dinding Bulat Estetik', 'Cermin dinding frameless diameter 40cm.', 110000, 30);
INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(9, 'Dumbbell Set 10kg (2 pcs)', 'Dumbbell set bongkar pasang 10kg.', 400000, 20),
(9, 'Tali Skipping Digital', 'Tali skipping dengan penghitung lompatan.', 80000, 50),
(9, 'Sarung Tangan Gym', 'Sarung tangan fitness anti-slip.', 60000, 70),
(9, 'Sepeda Statis X-Bike', 'Sepeda statis magnetik lipat.', 1300000, 10);
INSERT INTO product (store_id, product_name, description, price, stock) VALUES
(10, 'Novel "Bumi Manusia" - Pramoedya', 'Edisi terbaru novel Bumi Manusia.', 120000, 50),
(10, 'Kamus Inggris-Indonesia Lengkap', 'Kamus 1 Miliar kata, hard cover.', 150000, 40),
(10, 'Buku Cerita Anak Bergambar', 'Buku dongeng anak sebelum tidur.', 55000, 80),
(10, 'Novel "Harry Potter 1" (Cover Baru)', 'Harry Potter dan Batu Bertuah.', 95000, 60);

INSERT INTO category_item (product_id, category_id) VALUES (1, 1), (2, 1), (3, 1), (4, 1), (4, 4);
INSERT INTO category_item (product_id, category_id) VALUES (5, 2), (6, 2), (7, 2), (8, 2);
INSERT INTO category_item (product_id, category_id) VALUES (9, 3), (10, 3), (11, 3), (12, 3);
INSERT INTO category_item (product_id, category_id) VALUES (13, 4), (14, 4), (15, 4), (16, 4);
INSERT INTO category_item (product_id, category_id) VALUES (17, 5), (18, 5), (19, 5), (20, 5);
INSERT INTO category_item (product_id, category_id) VALUES (21, 1), (22, 1), (23, 1), (24, 1), (24, 5);
INSERT INTO category_item (product_id, category_id) VALUES (25, 2), (26, 2), (27, 2), (28, 2);
INSERT INTO category_item (product_id, category_id) VALUES (29, 4), (30, 4), (31, 4), (32, 4);
INSERT INTO category_item (product_id, category_id) VALUES (33, 5), (34, 5), (35, 5), (36, 5), (36, 4);
INSERT INTO category_item (product_id, category_id) VALUES (37, 3), (38, 3), (39, 3), (40, 3);

INSERT INTO cart_item (buyer_id, product_id, quantity) VALUES
(11, 2, 1),
(11, 7, 2),
(12, 13, 1),
(13, 24, 1),
(13, 20, 1),
(14, 30, 3),
(15, 1, 1),
(15, 25, 5);

INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status, confirmed_at, delivery_time, received_at) VALUES
(11, 1, 300000, 'Jl. Pembeli 1, Jakarta', 'RECEIVED', 
 CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days');
INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES
(1, 4, 1, 300000, 300000);

INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status, confirmed_at, delivery_time) VALUES
(12, 7, 150000, 'Jl. Pembeli 2, Bandung', 'ON_DELIVERY', 
 CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 hour');
INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES
(2, 25, 2, 75000, 150000);

INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status, confirmed_at) VALUES
(11, 4, 200000, 'Jl. Pembeli 1, Jakarta', 'APPROVED', 
 CURRENT_TIMESTAMP - INTERVAL '1 day');
INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES
(3, 14, 1, 200000, 200000);

INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status) VALUES
(14, 10, 270000, 'Jl. Pembeli 4, Yogyakarta', 'WAITING_APPROVAL');
INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES
(4, 37, 1, 120000, 120000),
(4, 38, 1, 150000, 150000);

INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status, reject_reason) VALUES
(15, 9, 400000, 'Jl. Pembeli 5, Medan', 'REJECTED', 'Stok barang habis, menunggu konfirmasi restock.');
INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES
(5, 33, 1, 400000, 400000);

INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status) VALUES
(12, 6, 12000000, 'Jl. Pembeli 2, Bandung', 'WAITING_APPROVAL');
INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES
(6, 21, 1, 12000000, 12000000);

INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status, confirmed_at, delivery_time, received_at) VALUES
(13, 3, 90000, 'Jl. Pembeli 3, Surabaya', 'RECEIVED', 
 CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '7 days');
INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES
(7, 11, 2, 45000, 90000);

UPDATE product SET main_image_path = '/public/images/products/' || product_id || '.jpg';

UPDATE product p
SET search_text = 
    LOWER(
        regexp_replace(
            p.product_name || ' ' || 
            COALESCE(p.description, '') || ' ' || 
            s.store_name || ' ' || 
            COALESCE((SELECT STRING_AGG(c.category_name, ' ')
                      FROM category_item ci
                      JOIN category c ON ci.category_id = c.category_id
                      WHERE ci.product_id = p.product_id), ''), 
            '<[^>]+>', ' ', 'g'
        )
    ) || ' ' ||
    (CASE 
        WHEN p.product_name ILIKE '%Laptop Gaming%' THEN 'notebook komputer jinjing pc portabel asus lenovo acer hp dell msi'
        WHEN p.product_name ILIKE '%TV LED%' THEN 'televisi smart tv android tv flat screen'
        WHEN p.product_name ILIKE '%Kipas Angin%' THEN 'fan ac pendingin ruangan'
        WHEN p.product_name ILIKE '%Blender%' THEN 'juicer gilingan bumbu penghalus'
        WHEN p.product_name ILIKE '%Smartphone%' THEN 'handphone hp telpon genggam android ios iphone samsung xiaomi oppo vivo'
        WHEN p.product_name ILIKE '%Powerbank%' THEN 'cas portabel charger portable pengisi daya baterai cadangan'
        WHEN p.product_name ILIKE '%Earbuds%' THEN 'tws headset earphone audio nirkabel bluetooth'
        WHEN p.product_name ILIKE '%Smartwatch%' THEN 'jam tangan pintar jam digital arloji pintar'
        WHEN p.product_name ILIKE '%Rice Cooker%' THEN 'penanak nasi magic com magic jar'
        WHEN p.product_name ILIKE '%Oven Listrik%' THEN 'pemanggang microwave'
        WHEN p.product_name ILIKE '%Lampu Belajar%' THEN 'lampu meja desk lamp'
        WHEN p.product_name ILIKE '%Kemeja Batik%' THEN 'baju atasan hem pakaian formal kondangan gaun'
        WHEN p.product_name ILIKE '%Gaun Pesta%' THEN 'dress baju pesta long dress'
        WHEN p.product_name ILIKE '%Celana Kulot Jeans%' THEN 'denim celana panjang wanita'
        WHEN p.product_name ILIKE '%Jaket Kulit%' THEN 'jacket motor touring'
        WHEN p.product_name ILIKE '%Kaos Polos%' THEN 't-shirt baju santai'
        WHEN p.product_name ILIKE '%Celana Chino%' THEN 'celana panjang katun celana kasual'
        WHEN p.product_name ILIKE '%Hoodie Zipper%' THEN 'jaket jumper sweater'
        WHEN p.product_name ILIKE '%Kemeja Flanel%' THEN 'baju kotak-kotak atasan flanel'
        WHEN p.product_name ILIKE '%Panci Set%' THEN 'wajan teflon masak'
        WHEN p.product_name ILIKE '%Pisau Dapur%' THEN 'alat potong'
        WHEN p.product_name ILIKE '%Meja Lipat Laptop%' THEN 'meja belajar portable'
        WHEN p.product_name ILIKE '%Rak Sepatu%' THEN 'lemari sepatu tempat penyimpanan'
        WHEN p.product_name ILIKE '%Cermin Dinding%' THEN 'kaca rias'
        WHEN p.product_name ILIKE '%Sepatu Lari%' THEN 'sneakers running shoes'
        WHEN p.product_name ILIKE '%Raket Badminton%' THEN 'bulutangkis'
        WHEN p.product_name ILIKE '%Bola Basket%' THEN 'basket ball'
        WHEN p.product_name ILIKE '%Matras Yoga%' THEN 'alas olahraga senam'
        WHEN p.product_name ILIKE '%Dumbbell Set%' THEN 'barbel angkat beban alat gym fitness'
        WHEN p.product_name ILIKE '%Tali Skipping%' THEN 'jump rope lompat tali'
        WHEN p.product_name ILIKE '%Sepeda Statis%' THEN 'alat fitness cardio x-bike'
        WHEN p.product_name ILIKE '%Novel%' OR p.product_name ILIKE '%Komik%' THEN 'buku bacaan fiksi'
        WHEN p.product_name ILIKE '%Buku Resep%' THEN 'buku masak'
        WHEN p.product_name ILIKE '%Sejarah%' OR p.product_name ILIKE '%Kamus%' THEN 'buku non-fiksi buku pelajaran'
        ELSE '' 
    END)
FROM 
    store s
WHERE 
    p.store_id = s.store_id;
