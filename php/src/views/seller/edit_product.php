<?php $mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Produk: <?= htmlspecialchars($product['name']) ?></title>
    <link rel="stylesheet" href="/../public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/../public/css/product_management.css">
    <link rel="stylesheet" href="/../public/css/edit_product.css">
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
</head>
<body class="seller-page">
    
    <?php require __DIR__ . '/../components/navbar.php'; ?>

    <main class="container">
        <div class="page-header">
            <h1>Edit Produk</h1>
        </div>

        <form id="editProductForm" class="form-container" 
              data-product-id="<?= $product['id'] ?>"
              enctype="multipart/form-data">
            
            <div class="form-group">
                <label for="product_name">Nama Produk</label>
                <input type="text" id="product_name" name="product_name" class="form-input" 
                       value="<?= htmlspecialchars($product['name']) ?>" maxlength="200" required>
            </div>

            <div class="form-group">
                <label for="quill-editor">Deskripsi Produk (Max 1000 karakter)</label>
                <div id="quill-editor"></div>
                <textarea id="description" name="description" style="display:none;"><?= htmlspecialchars($product['description']) ?></textarea>
                <div id="desc-error" class="validation-error"></div>
            </div>

            <div class="form-group">
                <label for="categories">Kategori</label>
                <select id="categories" name="categories[]" class="form-select" multiple required>
                    <?php foreach ($allCategories as $category): ?>
                        <?php 
                        $isSelected = in_array($category['category_id'], $productCategoryIds);
                        ?>
                        <option value="<?= $category['category_id'] ?>" <?= $isSelected ? 'selected' : '' ?>>
                            <?= htmlspecialchars($category['category_name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <small>Bisa pilih lebih dari satu.</small>
            </div>

            <div class="form-group">
                <label for="price">Harga (Min. Rp 1.000)</label>
                <input type="number" id="price" name="price" class="form-input" 
                       value="<?= $product['price'] ?>" min="1000" required>
            </div>

            <div class="form-group">
                <label for="stock">Stok (Min. 0)</label>
                <input type="number" id="stock" name="stock" class="form-input" 
                       value="<?= $product['stock'] ?>" min="0" required>
            </div>

            <div class="form-group">
                <label>Foto Produk</label>
                <div id="image-preview-container">
                    <img id="image-preview" src="<?= htmlspecialchars($product['image']) ?>" alt="Preview Foto">
                    <button type="button" id="changePhotoBtn" class="btn btn-secondary btn-sm">Ganti Foto</button>
                </div>
                <input type="file" id="photo" name="photo" class="form-input" accept="image/jpeg, image/png, image/webp" style="display:none;">
                <label id="photo-input-label" for="photo">Ganti Foto Produk (Opsional, Max 2MB)</label>
                <div id="photo-error" class="validation-error"></div>
            </div>

            <div class="form-actions">
                <a href="/seller/products" class="btn btn-secondary">Batal</a>
                <button type="submit" id="saveBtn" class="btn btn-primary">Simpan Perubahan</button>
            </div>
        </form>
    </main>

    <div id="toast" class="toast"></div>

    <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/seller_edit_product.js"></script>
</body>
</html>