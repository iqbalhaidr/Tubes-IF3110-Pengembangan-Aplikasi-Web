<?php 
$mainCssVersion = filemtime(__DIR__ . '/../public/css/main.css');
$notFoundCssVersion = filemtime(__DIR__ . '/../public/css/404.css');

// Variables passed from controller
$reason = $featureDisabledReason ?? 'This feature is currently unavailable.';
$isGlobal = $featureDisabledIsGlobal ?? false;

// Feature name mapping (matches React FeatureGate.jsx)
$featureInfo = [
    'checkout_enabled' => ['name' => 'Checkout', 'icon' => '🛒', 'description' => 'Complete your purchases'],
    'chat_enabled' => ['name' => 'Chat', 'icon' => '💬', 'description' => 'Message other users'],
    'auction_enabled' => ['name' => 'Auction', 'icon' => '🔨', 'description' => 'Browse and bid on auctions']
];

// Default to checkout for PHP pages (cart/checkout)
$featureName = $featureDisabledName ?? 'checkout_enabled';
$info = $featureInfo[$featureName] ?? ['name' => 'Feature', 'icon' => '🔒', 'description' => 'This feature'];

// Navbar setup - same as cart.php
$navbarType = 'buyer';
$initialCartCount = 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $info['name'] ?> Unavailable - Nimonspedia</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/404.css?v=<?= $notFoundCssVersion ?>">
    <link rel="stylesheet" href="/public/css/logout-modal.css">
    <style>
        /* Feature disabled page specific styles - matches React FeatureGate.jsx */
        .feature-disabled-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }
        .feature-disabled-content {
            margin-top: 120px;
            text-align: center;
            max-width: 500px;
        }
        .feature-disabled-icon {
            font-size: 80px;
            margin-bottom: 24px;
            animation: float 3s ease-in-out infinite;
        }
        @media (max-width: 640px) {
            .feature-disabled-icon {
                font-size: 60px;
            }
        }
        .feature-disabled-title {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-dark, #1a2942);
            margin-bottom: 16px;
        }
        @media (max-width: 640px) {
            .feature-disabled-title {
                font-size: 22px;
            }
        }
        .feature-disabled-reason {
            font-size: 16px;
            color: var(--text-medium, #6b7280);
            line-height: 1.6;
            margin-bottom: 32px;
            padding: 16px;
            background: linear-gradient(to bottom right, #fffbeb, #fef3c7);
            border-radius: 12px;
            border-left: 4px solid #fbbf24;
        }
        .feature-disabled-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 24px;
        }
        @media (max-width: 640px) {
            .feature-disabled-actions {
                flex-direction: column;
            }
        }
        .feature-disabled-btn {
            display: inline-block;
            padding: 12px 24px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 8px;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }
        @media (max-width: 640px) {
            .feature-disabled-btn {
                width: 100%;
            }
        }
        .feature-disabled-btn.primary {
            background: var(--primary-green, #03ac0e);
            color: white;
        }
        .feature-disabled-btn.primary:hover {
            background: var(--primary-green-hover, #028a0c);
            transform: translateY(-2px);
        }
        .feature-disabled-btn.secondary {
            background: var(--background-gray, #f3f4f6);
            color: var(--text-dark, #1a2942);
        }
        .feature-disabled-btn.secondary:hover {
            background: var(--border-color, #e5e7eb);
        }
        .maintenance-badge {
            display: inline-block;
            padding: 6px 16px;
            background: linear-gradient(to bottom right, #eff6ff, #dbeafe);
            color: #1d4ed8;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .feature-disabled-footer-text {
            font-size: 14px;
            color: var(--text-light, #9ca3af);
            margin: 0;
        }
    </style>
</head>
<body>
    <?php include __DIR__ . '/components/navbar.php'; ?>

    <main class="feature-disabled-container">
        <div class="feature-disabled-content">
            <div class="feature-disabled-icon"><?= $info['icon'] ?></div>
            
            <?php if ($isGlobal): ?>
                <span class="maintenance-badge">🔧 Under Maintenance</span>
            <?php endif; ?>
            
            <h1 class="feature-disabled-title"><?= $info['name'] ?> is Currently Unavailable</h1>
            
            <p class="feature-disabled-reason"><?= htmlspecialchars($reason ?: $info['description'] . ' is temporarily unavailable. Please try again later.') ?></p>
            
            <div class="feature-disabled-actions">
                <a href="/" class="feature-disabled-btn primary">← Back to Home</a>
                <button onclick="window.location.reload()" class="feature-disabled-btn secondary">Try Again</button>
            </div>
            
            <?php if ($isGlobal): ?>
                <p class="feature-disabled-footer-text">
                    Our team is working on it. Please check back later.
                </p>
            <?php else: ?>
                <p class="feature-disabled-footer-text">
                    If you believe this is an error, please contact support.
                </p>
            <?php endif; ?>
        </div>
    </main>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/balance.js"></script>
    <script src="/public/js/main.js"></script>
</body>
</html>