<?php
session_start();

// START SESSION FIRST - Before anything else!
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// A simple router
$uri = $_SERVER['REQUEST_URI'];

// Autoload classes (a simple version)
spl_autoload_register(function ($class_name) {
    // Look in controllers
    $controller_file = __DIR__ . '/controllers/' . $class_name . '.php';
    if (file_exists($controller_file)) {
        require_once $controller_file;
        return;
    }

    // Look in models
    $model_file = __DIR__ . '/models/' . $class_name . '.php';
    if (file_exists($model_file)) {
        require_once $model_file;
        return;
    }

    // Look in middleware
    $middleware_file = __DIR__ . '/middleware/' . $class_name . '.php';
    if (file_exists($middleware_file)) {
        require_once $middleware_file;
        return;
    }

    // Look in utils
    $util_file = __DIR__ . '/utils/' . $class_name . '.php';
    if (file_exists($util_file)) {
        require_once $util_file;
        return;
    }
});

AuthMiddleware::startSession();

// Parse URI and method
$method = $_SERVER['REQUEST_METHOD'];
$uri_parts = parse_url($uri);
$path = $uri_parts['path'] ?? '/';

// Remove leading/trailing slashes
$path = trim($path, '/');
if (empty($path)) {
    $path = 'home';
}

// Routing
$route_parts = explode('/', $path);

// Route matching
if ($route_parts[0] === 'auth') {
    $authController = new AuthController();
    
    if ($route_parts[1] === 'login') {
        if ($method === 'GET') {
            $authController->showLogin();
        } elseif ($method === 'POST') {
            $authController->login();
        }
    } elseif ($route_parts[1] === 'register') {
        $registerAction = $route_parts[2] ?? null;

        if ($registerAction === null) {
            if ($method === 'GET') {
                $authController->showRegister();
            } else {
                Response::error('Method not allowed', null, 405);
            }
        } elseif ($registerAction === 'buyer') {
            if ($method === 'GET') {
                $authController->showRegisterBuyer();
            } elseif ($method === 'POST') {
                $authController->registerBuyer();
            } else {
                Response::error('Method not allowed', null, 405);
            }
        } elseif ($registerAction === 'seller') {
            if ($method === 'GET') {
                $authController->showRegisterSeller();
            } elseif ($method === 'POST') {
                $authController->registerSeller();
            } else {
                Response::error('Method not allowed', null, 405);
            }
        } else {
            header("HTTP/1.0 404 Not Found");
            require_once __DIR__ . '/views/404.php';
        }
    } elseif ($route_parts[1] === 'logout') {
        $authController->logout();
    } elseif ($route_parts[1] === 'me') {
        $authController->getCurrentUser();
    } elseif ($route_parts[1] === 'profile' && $method === 'POST') {
        $authController->updateProfile();
    } elseif ($route_parts[1] === 'change-password' && $method === 'POST') {
        $authController->changePassword();
    } else {
        // Auth route not found
        header("HTTP/1.0 404 Not Found");
        require_once __DIR__ . '/views/404.php';
    }
} elseif ($route_parts[0] === 'home' || $route_parts[0] === '') {
    $controller = new HomeController();
    $controller->index();

} elseif ($route_parts[0] === 'cart') {
    $cartController = new CartController();

    if ($method === 'GET') {
        if (empty($route_parts[1])) {
            $cartController->index();
        } elseif ($route_parts[1] === 'items') {
            $cartController->fetchItems();
        } else {
            // Invalid path
            header("HTTP/1.0 404 Not Found");
            require_once __DIR__ . '/views/404.php';
        }

    } elseif ($method === 'POST') {
        // await api.post('/cart', { product_id: {value} });
        $cartController->addItem();

    } elseif ($method === 'PUT') {
        if (!empty($route_parts[1])) {
            $cart_item_id = $route_parts[1];
            $cartController->updateItem($cart_item_id);
        } else {
            // Invalid path
            header("HTTP/1.0 404 Not Found");
            require_once __DIR__ . '/views/404.php';
        }

    } elseif ($method === 'DELETE') {
        $cart_item_id = $route_parts[1];
        $cartController->deleteItem($cart_item_id);

    } else {
        // Cart route not found
        header("HTTP/1.0 404 Not Found");
        require_once __DIR__ . '/views/404.php';
    }

} elseif ($route_parts[0] === 'api') {
    if ($route_parts[1] === 'products' && $method === 'GET') {
        $controller = new ProductController();
        $controller->getProducts();
    } elseif ($route_parts[1] === 'categories' && $method === 'GET') {
        $controller = new CategoryController();
        $controller->getAllCategories();
    } elseif ($route_parts[1] === 'cartcounter' && $method === 'GET') {
        $controller = new CartController();
        $controller->getUniqueItemCount();
    } else {
        header("HTTP/1.0 404 Not Found");
        echo json_encode(['success' => false, 'message' => 'API endpoint not found']);
        exit;
    }
} elseif ($route_parts[0] === 'product') {
    if (isset($route_parts[1]) && is_numeric($route_parts[1])) {
        if ($method === 'GET') {
            $controller = new ProductController();
            $id = (int)$route_parts[1];
            $controller->showProductDetail($id);
        } else {
            Response::error('Method not allowed', null, 405);
        }
    } else {
        header("HTTP/1.0 404 Not Found");
        require_once __DIR__ . '/views/404.php';
    } 

} elseif ($route_parts[0] === 'store') {
    if (isset($route_parts[1]) && is_numeric($route_parts[1])) {
        if ($method === 'GET') {
            $controller = new StoreController();
            $id = (int)$route_parts[1]; 
            $controller->showStorePage($id); 
        } else {
            Response::error('Method not allowed', null, 405);
        }
    } else {
        header("HTTP/1.0 404 Not Found");
        require_once __DIR__ . '/views/404.php';
    }
} elseif ($route_parts[0] === 'buyer') {
    $controller = new HomeController();

    if (!isset($route_parts[1]) || $route_parts[1] === '' || $route_parts[1] === 'home') {
        // Redirect to unified home page
        header('Location: /home');
        exit;
    } elseif ($route_parts[1] === 'profile') {
        $controller->buyerProfile();
    } else {
        header("HTTP/1.0 404 Not Found");
        require_once __DIR__ . '/views/404.php';
    }
} elseif ($route_parts[0] === 'seller') {
    $controller = new HomeController();

    if (!isset($route_parts[1]) || $route_parts[1] === '' || $route_parts[1] === 'dashboard') {
        $controller->sellerDashboard();
    } elseif ($route_parts[1] === 'profile') {
        $controller->sellerProfile();
    } else {
        header("HTTP/1.0 404 Not Found");
        require_once __DIR__ . '/views/404.php';
    }
} elseif ($route_parts[0] === 'balance') {
    $balanceController = new BalanceController();

    if (($route_parts[1] ?? '') === 'top-up' && $method === 'POST') {
        $balanceController->topUp();
    } else {
        Response::error('Not found', null, 404);
    }
} elseif ($route_parts[0] === 'checkout') {
    $orderController = new OrderController();

    if ($method === 'GET') {
        // This is the new method to show the page
        $orderController->showCheckoutPage();
    } elseif ($method === 'POST') {
        // This is the API endpoint to process the checkout
        $orderController->processCheckout();
    } else {
        // A GET /checkout page isn't defined, only the POST action
        Response::error('Method not allowed', null, 405);
    }
} else {
    // Not Found
    header("HTTP/1.0 404 Not Found");
    require_once __DIR__ . '/views/404.php';
}

?>