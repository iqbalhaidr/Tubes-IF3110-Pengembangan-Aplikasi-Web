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

-- ============================================
-- MILESTONE 2: AUCTION SEED DATA
-- ============================================
-- Product-Store-Seller mapping reference:
-- Store 1 (seller_id=1): products 1-4 (TV, Laptop, Kipas, Blender)
-- Store 2 (seller_id=2): products 5-8 (Kemeja Batik, Gaun, Celana Kulot, Jaket)
-- Store 3 (seller_id=3): products 9-12 (Novel Laskar, Buku Resep, Komik, Sejarah)
-- Store 4 (seller_id=4): products 13-16 (Panci, Pisau, Rice Cooker, Oven)
-- Store 5 (seller_id=5): products 17-20 (Sepatu Lari, Raket, Bola Basket, Matras)
-- Store 6 (seller_id=6): products 21-24 (Smartphone, Powerbank, TWS, Smartwatch)
-- Store 7 (seller_id=7): products 25-28 (Kaos, Celana Chino, Hoodie, Kemeja Flanel)
-- Store 8 (seller_id=8): products 29-32 (Lampu, Meja Lipat, Rak Sepatu, Cermin)
-- Store 9 (seller_id=9): products 33-36 (Dumbbell, Tali Skipping, Sarung Tangan, Sepeda Statis)
-- Store 10 (seller_id=10): products 37-40 (Novel Bumi, Kamus, Buku Anak, Harry Potter)
-- Buyers: user_id 11-15 (Lina, Mega, Nina, Oscar, Rina)

-- Scheduled auctions (will auto-activate at scheduled time)
INSERT INTO auctions (product_id, seller_id, initial_bid, current_bid, highest_bidder_id, min_bid_increment, status, countdown_end_time, start_time) VALUES
-- Scheduled Auction 1: Kipas Angin Berdiri (product 3, store 1, seller 1) - starts in 1 hour
(3, 1, 200000, 200000, NULL, 20000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '1 hour'),
-- Scheduled Auction 2: Kemeja Batik Wanita (product 5, store 2, seller 2) - starts in 3 hours
(5, 2, 150000, 150000, NULL, 15000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '3 hours', CURRENT_TIMESTAMP + INTERVAL '3 hours'),
-- Scheduled Auction 3: Buku Resep Masakan (product 10, store 3, seller 3) - starts in 30 minutes
(10, 3, 100000, 100000, NULL, 10000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '30 minutes', CURRENT_TIMESTAMP + INTERVAL '30 minutes'),
-- Scheduled Auction 4: Pisau Dapur Chef Set (product 14, store 4, seller 4) - starts in 2 hours
(14, 4, 180000, 180000, NULL, 20000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '2 hours'),
-- Scheduled Auction 5: Sepatu Lari Pria Original (product 17, store 5, seller 5) - starts tomorrow
(17, 5, 700000, 700000, NULL, 50000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day'),
-- Scheduled Auction 6: Powerbank 20000mAh (product 22, store 6, seller 6) - starts in 4 hours
(22, 6, 300000, 300000, NULL, 30000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '4 hours', CURRENT_TIMESTAMP + INTERVAL '4 hours'),
-- Scheduled Auction 7: Kaos Polos Katun (product 25, store 7, seller 7) - starts in 2.5 hours
(25, 7, 65000, 65000, NULL, 10000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '2.5 hours', CURRENT_TIMESTAMP + INTERVAL '2.5 hours'),
-- Scheduled Auction 8: Lampu Belajar LED (product 29, store 8, seller 8) - starts in 45 minutes
(29, 8, 120000, 120000, NULL, 10000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '45 minutes', CURRENT_TIMESTAMP + INTERVAL '45 minutes');

-- Active auctions with various countdown times (converted to SCHEDULED for testing)
INSERT INTO auctions (product_id, seller_id, initial_bid, current_bid, highest_bidder_id, min_bid_increment, status, countdown_end_time, start_time) VALUES
-- Auction 1: Laptop Gaming (product 2, store 1, seller 1) - scheduled to start in 10 minutes
(2, 1, 10000000, 10000000, NULL, 500000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '15 minutes', CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
-- Auction 2: Smartphone Flagship Pro (product 21, store 6, seller 6) - scheduled to start in 20 minutes
(21, 6, 8000000, 8000000, NULL, 250000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '20 minutes', CURRENT_TIMESTAMP + INTERVAL '20 minutes'),
-- Auction 3: Sepeda Statis X-Bike (product 36, store 9, seller 9) - scheduled to start in 5 minutes, no bids yet
(36, 9, 900000, 900000, NULL, 50000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '20 minutes', CURRENT_TIMESTAMP + INTERVAL '5 minutes'),
-- Auction 4: TV LED 50 inch Smart 4K (product 1, store 1, seller 1) - scheduled to start in 15 minutes
(1, 1, 3000000, 3000000, NULL, 100000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '20 minutes', CURRENT_TIMESTAMP + INTERVAL '15 minutes'),
-- Auction 5: Gaun Pesta Brokat (product 6, store 2, seller 2) - scheduled to start in 25 minutes
(6, 2, 500000, 500000, NULL, 50000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '40 minutes', CURRENT_TIMESTAMP + INTERVAL '25 minutes'),
-- Auction 6: Smartwatch Pro GPS (product 24, store 6, seller 6) - scheduled to start in 30 minutes
(24, 6, 1000000, 1000000, NULL, 100000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '45 minutes', CURRENT_TIMESTAMP + INTERVAL '30 minutes'),
-- Auction 7: Raket Badminton Carbon (product 18, store 5, seller 5) - scheduled to start in 8 minutes
(18, 5, 350000, 350000, NULL, 25000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '20 minutes', CURRENT_TIMESTAMP + INTERVAL '8 minutes'),
-- Auction 8: Dumbbell Set 10kg (product 33, store 9, seller 9) - scheduled to start in 12 minutes
(33, 9, 250000, 250000, NULL, 25000, 'SCHEDULED', CURRENT_TIMESTAMP + INTERVAL '27 minutes', CURRENT_TIMESTAMP + INTERVAL '12 minutes');

-- Ended auctions (for history)
INSERT INTO auctions (product_id, seller_id, initial_bid, current_bid, highest_bidder_id, min_bid_increment, status, countdown_end_time, started_at, ended_at, winner_id) VALUES
-- Ended auction 9: Novel Laskar Pelangi (product 9, store 3, seller 3) - completed with winner
(9, 3, 60000, 95000, 12, 5000, 'ENDED', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '1 day', 12),
-- Ended auction 10: Rice Cooker Digital (product 15, store 4, seller 4) - completed with winner
(15, 4, 400000, 550000, 14, 25000, 'ENDED', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 14);

-- Auction bids (for active and ended auctions)
INSERT INTO auction_bids (auction_id, bidder_id, bid_amount, placed_at) VALUES
-- Bids for Auction 1 (Laptop Gaming)
(1, 11, 10500000, CURRENT_TIMESTAMP - INTERVAL '20 hours'),
(1, 13, 11000000, CURRENT_TIMESTAMP - INTERVAL '18 hours'),
(1, 12, 11500000, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(1, 11, 12000000, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(1, 12, 12500000, CURRENT_TIMESTAMP - INTERVAL '2 hours'),

-- Bids for Auction 2 (Smartphone)
(2, 12, 8500000, CURRENT_TIMESTAMP - INTERVAL '1 day 20 hours'),
(2, 14, 9000000, CURRENT_TIMESTAMP - INTERVAL '1 day 12 hours'),
(2, 11, 9500000, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, 11, 10000000, CURRENT_TIMESTAMP - INTERVAL '6 hours'),

-- Bids for Auction 4 (TV LED)
(4, 11, 3200000, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(4, 13, 3500000, CURRENT_TIMESTAMP - INTERVAL '1 day 12 hours'),

-- Bids for Auction 5 (Gaun Pesta)
(5, 12, 550000, CURRENT_TIMESTAMP - INTERVAL '18 hours'),
(5, 15, 600000, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(5, 15, 650000, CURRENT_TIMESTAMP - INTERVAL '4 hours'),

-- Bids for Auction 6 (Smartwatch)
(6, 13, 1100000, CURRENT_TIMESTAMP - INTERVAL '1 day 18 hours'),
(6, 14, 1200000, CURRENT_TIMESTAMP - INTERVAL '1 day'),

-- Bids for Auction 8 (Dumbbell Set - ending soon!)
(8, 13, 275000, CURRENT_TIMESTAMP - INTERVAL '1 day 20 hours'),
(8, 11, 300000, CURRENT_TIMESTAMP - INTERVAL '1 day 12 hours'),
(8, 14, 325000, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(8, 13, 350000, CURRENT_TIMESTAMP - INTERVAL '12 hours'),
(8, 11, 375000, CURRENT_TIMESTAMP - INTERVAL '6 hours'),

-- Bids for Ended Auction 9 (Novel - ended)
(9, 11, 65000, CURRENT_TIMESTAMP - INTERVAL '2 days 20 hours'),
(9, 14, 70000, CURRENT_TIMESTAMP - INTERVAL '2 days 16 hours'),
(9, 12, 80000, CURRENT_TIMESTAMP - INTERVAL '2 days 10 hours'),
(9, 11, 85000, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(9, 12, 95000, CURRENT_TIMESTAMP - INTERVAL '1 day 12 hours'),

-- Bids for Ended Auction 10 (Rice Cooker - ended)
(10, 12, 425000, CURRENT_TIMESTAMP - INTERVAL '3 days 20 hours'),
(10, 13, 475000, CURRENT_TIMESTAMP - INTERVAL '3 days 12 hours'),
(10, 14, 500000, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(10, 12, 525000, CURRENT_TIMESTAMP - INTERVAL '2 days 12 hours'),
(10, 14, 550000, CURRENT_TIMESTAMP - INTERVAL '2 days 6 hours');

-- -- Chat messages for auctions
-- INSERT INTO chat_messages (auction_id, user_id, message, sent_at) VALUES
-- -- Chat for Auction 1 (Laptop Gaming)
-- (1, 11, 'Apakah laptop ini masih garansi?', CURRENT_TIMESTAMP - INTERVAL '22 hours'),
-- (1, 1, 'Iya, masih garansi resmi 1 tahun.', CURRENT_TIMESTAMP - INTERVAL '21 hours 50 minutes'),
-- (1, 12, 'Spek lengkapnya gimana ya?', CURRENT_TIMESTAMP - INTERVAL '15 hours'),
-- (1, 1, 'Core i7 12th Gen, RTX 4060, 16GB RAM, 512GB SSD', CURRENT_TIMESTAMP - INTERVAL '14 hours 30 minutes'),
-- (1, 13, 'Bisa COD Jakarta?', CURRENT_TIMESTAMP - INTERVAL '8 hours'),
-- (1, 1, 'Bisa, tapi tambah ongkir ya', CURRENT_TIMESTAMP - INTERVAL '7 hours 45 minutes'),

-- -- Chat for Auction 2 (Smartphone)
-- (2, 14, 'Kondisi HP gimana?', CURRENT_TIMESTAMP - INTERVAL '1 day 18 hours'),
-- (2, 6, 'Baru, masih segel resmi.', CURRENT_TIMESTAMP - INTERVAL '1 day 17 hours'),
-- (2, 11, 'Warna apa yang ready?', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- (2, 6, 'Hitam dan biru tersedia.', CURRENT_TIMESTAMP - INTERVAL '23 hours'),

-- -- Chat for Auction 5 (Gaun Pesta)
-- (5, 15, 'Ukuran yang tersedia apa saja?', CURRENT_TIMESTAMP - INTERVAL '20 hours'),
-- (5, 2, 'S, M, L tersedia. Mau yang mana?', CURRENT_TIMESTAMP - INTERVAL '19 hours 30 minutes'),
-- (5, 12, 'Warna selain ini ada?', CURRENT_TIMESTAMP - INTERVAL '16 hours'),
-- (5, 2, 'Ada merah maroon dan navy blue juga', CURRENT_TIMESTAMP - INTERVAL '15 hours 40 minutes');

-- -- Push subscriptions for testing
-- INSERT INTO push_subscriptions (user_id, subscription_data) VALUES
-- (11, '{"endpoint": "https://fcm.googleapis.com/fcm/send/test1", "keys": {"p256dh": "test_key_1", "auth": "test_auth_1"}}'),
-- (12, '{"endpoint": "https://fcm.googleapis.com/fcm/send/test2", "keys": {"p256dh": "test_key_2", "auth": "test_auth_2"}}'),
-- (13, '{"endpoint": "https://fcm.googleapis.com/fcm/send/test3", "keys": {"p256dh": "test_key_3", "auth": "test_auth_3"}}');
