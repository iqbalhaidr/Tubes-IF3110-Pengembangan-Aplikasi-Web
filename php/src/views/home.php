<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Product Discovery</title>
    <link rel="stylesheet" href="/public/css/main.css">
</head>
<body>
    <!-- Navigation Bar -->
    <nav class="navbar">
        <div class="container navbar-container">
            <!-- Left Side: Balance + Navigation Links -->
            <div class="navbar-left">
                <div class="balance-display" id="balanceDisplay" style="display: none;">
                    💰 Balance: Rp. 5000
                </div>
                
                <div class="navbar-links" id="navbarLinks">
                    <a href="/" class="navbar-link active">Discover</a>
                    <a href="/cart" class="navbar-link">Cart</a>
                    <a href="/checkout" class="navbar-link">Checkout</a>
                    <a href="/orders" class="navbar-link">Orders</a>
                </div>
            </div>

            <!-- Right Side: User Profile / Auth Links -->
            <div class="navbar-right">
                <!-- User Profile (if logged in) -->
                <div class="user-profile" id="userProfile" style="display: none;">
                    <div class="user-avatar" id="userAvatar">R</div>
                    <span class="user-name" id="userName">Rafif Farras</span>
                    <button class="logout-icon" id="logoutBtn" title="Logout">➜</button>
                </div>

                <!-- Auth Links (if not logged in) -->
                <div class="auth-links" id="authLinks">
                    <a href="/auth/login" class="navbar-link">Login</a>
                    <a href="/auth/register" class="navbar-link">Register</a>
                </div>
            </div>

            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-toggle" id="mobileMenuToggle">☰</button>
        </div>
    </nav>

    <!-- Filter Bar with Search -->
    <div class="filter-bar">
        <div class="container">
            <div class="filter-container">
                <!-- Search Bar -->
                <div class="search-wrapper">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="search-input" id="searchInput" placeholder="Search">
                </div>
                
                <!-- Filter Buttons -->
                <button class="filter-button" id="categoryFilter">
                    ☰ Filter by Category
                </button>
                <button class="filter-button" id="priceFilter">
                    ☰ Filter by price
                </button>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <main class="main-content">
        <div class="container">
            <!-- Products Grid -->
            <div class="products-grid" id="productsGrid">
                <!-- Product cards will be loaded here dynamically -->
                <!-- Sample Product Card Structure -->
                <div class="product-card">
                    <div class="product-image">
                        <img src="/public/images/placeholder.png" alt="Product" onerror="this.style.display='none'; this.parentElement.innerHTML='🛒'">
                    </div>
                    <div class="product-info">
                        <div class="product-category">Name:</div>
                        <div class="product-name">Kategori:</div>
                        <div class="product-category">Harga:</div>
                        <div class="product-store">Nama Toko:</div>
                        <div class="product-actions">
                            <button class="btn btn-primary">View Store</button>
                            <button class="btn btn-secondary">View Detail</button>
                            <button class="btn btn-icon">🛒</button>
                        </div>
                    </div>
                </div>

                <!-- Repeat for 6 cards to match the image -->
                <div class="product-card">
                    <div class="product-image">🛒</div>
                    <div class="product-info">
                        <div class="product-category">Name:</div>
                        <div class="product-name">Kategori:</div>
                        <div class="product-category">Harga:</div>
                        <div class="product-store">Nama Toko:</div>
                        <div class="product-actions">
                            <button class="btn btn-primary">View Store</button>
                            <button class="btn btn-secondary">View Detail</button>
                            <button class="btn btn-icon">🛒</button>
                        </div>
                    </div>
                </div>

                <div class="product-card">
                    <div class="product-image">🛒</div>
                    <div class="product-info">
                        <div class="product-category">Name:</div>
                        <div class="product-name">Kategori:</div>
                        <div class="product-category">Harga:</div>
                        <div class="product-store">Nama Toko:</div>
                        <div class="product-actions">
                            <button class="btn btn-primary">View Store</button>
                            <button class="btn btn-secondary">View Detail</button>
                            <button class="btn btn-icon">🛒</button>
                        </div>
                    </div>
                </div>

                <div class="product-card">
                    <div class="product-image">🛒</div>
                    <div class="product-info">
                        <div class="product-category">Name:</div>
                        <div class="product-name">Kategori:</div>
                        <div class="product-category">Harga:</div>
                        <div class="product-store">Nama Toko:</div>
                        <div class="product-actions">
                            <button class="btn btn-primary">View Store</button>
                            <button class="btn btn-secondary">View Detail</button>
                            <button class="btn btn-icon">🛒</button>
                        </div>
                    </div>
                </div>

                <div class="product-card">
                    <div class="product-image">🛒</div>
                    <div class="product-info">
                        <div class="product-category">Name:</div>
                        <div class="product-name">Kategori:</div>
                        <div class="product-category">Harga:</div>
                        <div class="product-store">Nama Toko:</div>
                        <div class="product-actions">
                            <button class="btn btn-primary">View Store</button>
                            <button class="btn btn-secondary">View Detail</button>
                            <button class="btn btn-icon">🛒</button>
                        </div>
                    </div>
                </div>

                <div class="product-card">
                    <div class="product-image">🛒</div>
                    <div class="product-info">
                        <div class="product-category">Name:</div>
                        <div class="product-name">Kategori:</div>
                        <div class="product-category">Harga:</div>
                        <div class="product-store">Nama Toko:</div>
                        <div class="product-actions">
                            <button class="btn btn-primary">View Store</button>
                            <button class="btn btn-secondary">View Detail</button>
                            <button class="btn btn-icon">🛒</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div class="pagination" id="pagination">
                <button class="pagination-button" id="prevPage">◀</button>
                <span class="page-info">1</span>
                <button class="pagination-button" id="nextPage">▶</button>
            </div>
        </div>
    </main>

    <script src="/public/js/main.js"></script>
</body>
</html>