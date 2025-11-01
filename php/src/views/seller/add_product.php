<?php $mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tambah Produk Baru</title>
    <link rel="stylesheet" href="/../public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/../public/css/product_management.css">
    
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
    <link rel="stylesheet" href="/public/css/add_product.css">
</head>
<body class="seller-page">
    
    <?php require __DIR__ . '/../components/navbar.php'; ?>

    <main class="container">
        <div class="page-header">
            <h1>Tambah Produk Baru</h1>
        </div>

        <form id="addProductForm" class="form-container" enctype="multipart/form-data">
            
            <div class="form-group">
                <label for="product_name">Nama Produk</label>
                <input type="text" id="product_name" name="product_name" class="form-input" maxlength="200" required>
                <div id="name-error" class="validation-error"></div>
            </div>

            <div class="form-group">
                <label for="quill-editor">Deskripsi Produk (Max 5000 karakter)</label>
                <div id="quill-editor"></div>
                <input type="hidden" id="description" name="description">
                <div id="desc-error" class="validation-error"></div>
            </div>

            <div class="form-group">
                <label for="categories">Kategori</label>
                <select id="categories" name="categories[]" class="form-select" multiple required>
                    <?php foreach ($categories as $category): ?>
                        <option value="<?= $category['category_id'] ?>"><?= htmlspecialchars($category['category_name']) ?></option>
                    <?php endforeach; ?>
                </select>
                <small>Bisa pilih lebih dari satu.</small>
            </div>

            <div class="form-group">
                <label for="price">Harga (Min. Rp 1.000)</label>
                <input type="number" id="price" name="price" class="form-input" min="1000" required>
            </div>

            <div class="form-group">
                <label for="stock">Stok (Min. 0)</label>
                <input type="number" id="stock" name="stock" class="form-input" min="0" value="" required>
            </div>

            <div class="form-group">
                <label for="photo">Foto Produk (Max 2MB)</label>
                <input type="file" id="photo" name="photo" class="form-input" accept="image/jpeg, image/png, image/webp" required>
                <div id="photo-error" class="validation-error"></div>
                <div id="image-preview-container" style="display:none;">
                    <img id="image-preview" src="#" alt="Preview Foto">
                    <button type="button" id="changePhotoBtn" class="btn btn-secondary btn-sm">Ganti Foto</button>
                </div>
            </div>

            <div class="form-actions">
                <a href="/seller/products" class="btn btn-secondary">Batal</a>
                <button type="submit" id="saveBtn" class="btn btn-primary">Simpan</button>
            </div>
        </form>
    </main>

    <div id="toast" class="toast"></div>

    <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/add_product.js"></script> </body>
</html>