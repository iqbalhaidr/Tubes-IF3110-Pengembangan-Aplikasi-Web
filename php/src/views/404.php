<?php 
$mainCssVersion = filemtime(__DIR__ . '/../public/css/main.css');
$notFoundCssVersion = filemtime(__DIR__ . '/../public/css/404.css');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 Not Found - Nimonspedia</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/404.css?v=<?= $notFoundCssVersion ?>">
</head>
<body class="not-found-page">
    <nav class="navbar">
        <div class="container navbar-container">
            <a href="/" class="navbar-brand">Nimonspedia</a>
            <div class="navbar-left">
                <div class="navbar-links" id="navbarMenu">
                    <a href="/" class="navbar-link">Home</a>
                </div>
            </div>
        </div>
    </nav>

    <main class="not-found-container">
        <div class="not-found-content">
            <div class="not-found-illustration">
                <div class="number-404">404</div>
                <div class="error-icon">🔍</div>
            </div>
            
            <div class="not-found-text">
                <h1>Oops! Page Not Found</h1>
                <p class="error-description">The page you're looking for seems to have wandered off into the digital void.</p>
                
                <div class="suggestion-box">
                    <p class="suggestion-text">Here are some helpful links instead:</p>
                    <div class="suggestion-links">
                        <a href="/" class="suggestion-button primary">🏠 Go Home</a>
                        <a href="/home" class="suggestion-button secondary">🛍️ Browse Products</a>
                        <a href="/auth/login" class="suggestion-button secondary">🔑 Login</a>
                    </div>
                </div>

                <div class="error-details">
                    <p><small>The resource you requested could not be found. This might be because:</small></p>
                    <ul>
                        <li>The URL was typed incorrectly</li>
                        <li>The page has been moved or removed</li>
                        <li>The link you followed is broken or outdated</li>
                    </ul>
                </div>
            </div>
        </div>
    </main>

    <footer class="landing-footer">
        <div class="container">
            <p>Copyright <?= date('Y') ?> Nimonspedia. Dibuat untuk komunitas Nimons dengan penuh semangat.</p>
        </div>
    </footer>
</body>
</html>