<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Home</title>
</head>
<body>
    <h1>Welcome to Nimonspedia</h1>
    <h2>Categories</h2>
    <?php if (!empty($categories)): ?>
        <ul>
            <?php foreach ($categories as $category): ?>
                <li><?= htmlspecialchars($category['name']) ?></li>
            <?php endforeach; ?>
        </ul>
    <?php else: ?>
        <p>No categories found.</p>
    <?php endif; ?>
</body>
</html>