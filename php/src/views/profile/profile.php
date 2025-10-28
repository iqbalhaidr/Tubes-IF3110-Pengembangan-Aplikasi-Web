<?php
$navLinks = $navLinks ?? [];
$profileSections = $profileSections ?? [];
$metaSummary = $metaSummary ?? [];
$currentRole = $currentRole ?? 'BUYER';
$profileTitle = $profileTitle ?? 'Profile';
$profileSubtitle = $profileSubtitle ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Profile</title>
    <link rel="stylesheet" href="/public/css/main.css">
</head>
<body class="profile-page">
    <nav class="navbar <?= $currentRole === 'SELLER' ? 'seller-navbar' : '' ?>">
        <div class="container navbar-container">
            <a href="<?= $currentRole === 'SELLER' ? '/seller/dashboard' : '/buyer/home' ?>" class="navbar-brand">Nimonspedia</a>
            <div class="navbar-left">
                <?php if ($currentRole === 'BUYER'): ?>
                <div class="balance-display" id="balanceDisplay" style="display: none;">
                    Balance: Rp. 0
                </div>
                <?php endif; ?>
                <div class="navbar-links" id="navbarMenu">
                    <?php foreach ($navLinks as $link): ?>
                        <a href="<?= htmlspecialchars($link['href']) ?>" class="navbar-link <?= $link['active'] ? 'active' : '' ?>">
                            <?= htmlspecialchars($link['label']) ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
            <div class="navbar-right">
                <div class="user-profile" id="userProfile" style="display: none;">
                    <div class="user-avatar" id="userAvatar">U</div>
                    <span class="user-name" id="userName">User</span>
                    <button class="logout-icon" id="logoutBtn" title="Logout">Logout</button>
                </div>
                <div class="auth-links" id="authLinks">
                    <a href="/auth/login" class="navbar-link">Login</a>
                    <a href="/auth/register" class="navbar-link">Register</a>
                </div>
            </div>
            <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle navigation">
                <span class="menu-icon" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>
        </div>
    </nav>

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
                                        <dd><?= nl2br(htmlspecialchars($item['value'])) ?></dd>
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
    <script src="/public/js/main.js"></script>
</body>
</html>
