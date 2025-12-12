<?php
$pageTitle = $pageTitle ?? 'Settings';
$navbarType = 'seller';
$activeLink = 'settings';
$mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - <?= htmlspecialchars($pageTitle) ?></title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/profile.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/logout-modal.css?v=<?= $mainCssVersion ?>">
</head>
<body class="profile-page simple-layout">
    <?php include __DIR__ . '/../components/navbar.php'; ?>

    <main class="profile-main">
        <div class="container">
            <header class="profile-header">
                <h1 class="profile-title"><?= htmlspecialchars($pageTitle) ?></h1>
                <p class="profile-subtitle">Manage your account and notification settings.</p>
            </header>

            <?php if (isset($_GET['update']) && $_GET['update'] === 'success'): ?>
                <div class="alert success">
                    Preferences updated successfully!
                </div>
            <?php endif; ?>

            <section class="profile-layout-simple">
                <div class="profile-panels">
                    <article class="profile-card">
                        <div class="profile-card-header">
                            <h2>Browser Notifications</h2>
                        </div>
                        <div class="profile-details">
                            <div class="profile-detail-row">
                                <div>
                                    <button type="button" class="btn btn-secondary" id="masterNotificationBtn" disabled>Loading...</button>
                                    <p id="notificationStatusText" class="form-text"></p>
                                </div>
                            </div>
                        </div>
                    </article>

                     <article class="profile-card">
                        <div class="profile-card-header">
                            <h2>Notification Preferences</h2>
                        </div>
                        <form action="/seller/preferences" method="POST" class="profile-details">
                            <div class="profile-detail-row checkbox-row">
                                <label for="chat_enabled">Chat Notifications</label>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="chat_enabled" name="chat_enabled" <?php echo ($pushPreferences['chat_enabled'] ?? true) ? 'checked' : ''; ?>>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="profile-detail-row checkbox-row">
                                <label for="auction_enabled">Auction Notifications</label>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="auction_enabled" name="auction_enabled" <?php echo ($pushPreferences['auction_enabled'] ?? true) ? 'checked' : ''; ?>>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="profile-detail-row checkbox-row">
                                <label for="order_enabled">Order Status Notifications</label>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="order_enabled" name="order_enabled" <?php echo ($pushPreferences['order_enabled'] ?? true) ? 'checked' : ''; ?>>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="profile-actions">
                                <button type="submit" class="btn btn-primary">Save Preferences</button>
                            </div>
                        </form>
                    </article>
                </div>
            </section>
        </div>
    </main>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/notification-manager.js"></script>
</body>
</html>
