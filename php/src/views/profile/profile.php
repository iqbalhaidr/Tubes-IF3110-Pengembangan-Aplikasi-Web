<?php
$profileSections = $profileSections ?? [];
$metaSummary = $metaSummary ?? [];
$currentRole = $currentRole ?? 'BUYER';
$profileTitle = $profileTitle ?? 'Profile';
$profileSubtitle = $profileSubtitle ?? '';
$mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css');

// Set navbar type and active link
$navbarType = strtolower($currentRole);
$activeLink = 'profile';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Profile</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
</head>
<body class="profile-page">
    <?php include __DIR__ . '/../components/navbar.php'; ?>

    <main class="profile-main">
        <div class="container">
            <header class="profile-header">
                <span class="profile-kicker"><?= $currentRole === 'SELLER' ? 'Seller Center' : 'Account Overview' ?></span>
                <h1 class="profile-title"><?= htmlspecialchars($profileTitle) ?></h1>
                <p class="profile-subtitle"><?= htmlspecialchars($profileSubtitle) ?></p>
            </header>

            <section class="profile-layout">
                <div class="profile-panels">
                    <?php foreach ($profileSections as $section): ?>
                        <article class="profile-card">
                            <div class="profile-card-header">
                                <h2><?= htmlspecialchars($section['title']) ?></h2>
                            </div>
                            <dl class="profile-details">
                                <?php foreach ($section['items'] as $item): ?>
                                    <div class="profile-detail-row">
                                        <dt><?= htmlspecialchars($item['label']) ?></dt>
                                        <dd>
                                            <?php if (isset($item['isLogo']) && $item['isLogo']): ?>
                                                <?php if (!empty($item['value'])): ?>
                                                    <img src="/public/<?= htmlspecialchars($item['value']) ?>" alt="Store Logo" class="store-logo-preview" style="max-width: 200px; height: auto; border-radius: 8px; border: 1px solid var(--border-color);">
                                                <?php else: ?>
                                                    <span style="color: var(--text-light);">No logo uploaded</span>
                                                <?php endif; ?>
                                            <?php elseif (isset($item['isRichText']) && $item['isRichText']): ?>
                                                <?= $item['value'] ?>
                                            <?php else: ?>
                                                <?= nl2br(htmlspecialchars($item['value'])) ?>
                                            <?php endif; ?>
                                        </dd>
                                    </div>
                                <?php endforeach; ?>
                            </dl>
                        </article>
                    <?php endforeach; ?>
                </div>
                <aside class="profile-sidebar">
                    <div class="profile-card summary-card">
                        <div class="profile-card-header">
                            <h2>Quick Summary</h2>
                        </div>
                        <dl class="profile-details">
                            <?php foreach ($metaSummary as $item): ?>
                                <div class="profile-detail-row">
                                    <dt><?= htmlspecialchars($item['label']) ?></dt>
                                    <dd><?= nl2br(htmlspecialchars($item['value'])) ?></dd>
                                </div>
                            <?php endforeach; ?>
                        </dl>
                        <div class="profile-actions">
                            <a href="javascript:void(0);" class="btn btn-primary">Edit Profile</a>
                            <a href="javascript:void(0);" class="btn btn-secondary">Change Password</a>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    </main>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/balance.js"></script>
    <script src="/public/js/main.js"></script>
</body>
</html>
