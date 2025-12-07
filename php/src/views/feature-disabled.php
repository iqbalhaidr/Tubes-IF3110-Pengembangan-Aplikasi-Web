<?php 
$mainCssVersion = filemtime(__DIR__ . '/../public/css/main.css');
$notFoundCssVersion = filemtime(__DIR__ . '/../public/css/404.css');

// Variables passed from controller
$reason = $featureDisabledReason ?? 'This feature is currently unavailable.';
$isGlobal = $featureDisabledIsGlobal ?? false;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feature Unavailable - Nimonspedia</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/404.css?v=<?= $notFoundCssVersion ?>">
    <style>
        .feature-disabled-container {
            min-height: calc(100vh - 200px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }
        .feature-disabled-content {
            text-align: center;
            max-width: 500px;
        }
        .feature-disabled-icon {
            font-size: 80px;
            margin-bottom: 24px;
        }
        .feature-disabled-title {
            font-size: 28px;
            font-weight: 700;
            color: #1a2942;
            margin-bottom: 16px;
        }
        .feature-disabled-reason {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 24px;
            padding: 16px;
            background: #fff8e1;
            border-radius: 8px;
            border-left: 4px solid #ffca28;
        }
        .feature-disabled-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .feature-disabled-btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
        }
        .feature-disabled-btn.primary {
            background: #03ac0e;
            color: white;
        }
        .feature-disabled-btn.primary:hover {
            background: #028a0c;
        }
        .feature-disabled-btn.secondary {
            background: #f0f0f0;
            color: #333;
        }
        .feature-disabled-btn.secondary:hover {
            background: #e0e0e0;
        }
        .maintenance-badge {
            display: inline-block;
            padding: 6px 12px;
            background: #e3f2fd;
            color: #1565c0;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
        }
    </style>
</head>
<body class="not-found-page">
    <nav class="navbar">
        <div class="container navbar-container">
            <a href="/" class="navbar-brand">Nimonspedia</a>
            <div class="navbar-left">
                <div class="navbar-links" id="navbarMenu">
                    <a href="/" class="navbar-link">Home</a>
                    <a href="/cart" class="navbar-link">Cart</a>
                </div>
            </div>
        </div>
    </nav>

    <main class="feature-disabled-container">
        <div class="feature-disabled-content">
            <div class="feature-disabled-icon">🔒</div>
            
            <?php if ($isGlobal): ?>
                <span class="maintenance-badge">🔧 System Maintenance</span>
            <?php endif; ?>
            
            <h1 class="feature-disabled-title">Feature Temporarily Unavailable</h1>
            
            <p class="feature-disabled-reason"><?= htmlspecialchars($reason) ?></p>
            
            <div class="feature-disabled-actions">
                <a href="/" class="feature-disabled-btn primary">🏠 Back to Home</a>
                <a href="/cart" class="feature-disabled-btn secondary">🛒 View Cart</a>
            </div>
            
            <?php if (!$isGlobal): ?>
                <p style="margin-top: 24px; font-size: 14px; color: #999;">
                    If you believe this is an error, please contact our support team.
                </p>
            <?php else: ?>
                <p style="margin-top: 24px; font-size: 14px; color: #999;">
                    Our team is working on it. Please check back later.
                </p>
            <?php endif; ?>
        </div>
    </main>

    <footer class="landing-footer">
        <div class="container">
            <p>Copyright <?= date('Y') ?> Nimonspedia. Dibuat untuk komunitas Nimons dengan penuh semangat.</p>
        </div>
    </footer>
</body>
</html>
