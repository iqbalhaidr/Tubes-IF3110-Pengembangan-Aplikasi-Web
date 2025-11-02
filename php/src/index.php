<?php

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
    } elseif (($route_parts[1] === 'profile' || $route_parts[1] === 'update-profile') && $method === 'POST') {
        $authController->updateProfile();
    } elseif ($route_parts[1] === 'change-password' && $method === 'POST') {
        $authController->changePassword();
    } else {
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
        } elseif (isset($route_parts[1]) && $route_parts[1] === 'items') {
            $cartController->fetchItems();
        } else {
            header("HTTP/1.0 404 Not Found");
            require_once __DIR__ . '/views/404.php';
        }

    } elseif ($method === 'POST') {
        $cartController->addItem();

    } elseif ($method === 'PUT') {
        if (!empty($route_parts[1])) {
            $cart_item_id = $route_parts[1];
            $cartController->updateItem($cart_item_id);
        } else {
            header("HTTP/1.0 404 Not Found");
            require_once __DIR__ . '/views/404.php';
        }

    } elseif ($method === 'DELETE') {
        if (isset($route_parts[1])) {
            $cart_item_id = $route_parts[1];
            $cartController->deleteItem($cart_item_id);
        } else {
            header("HTTP/1.0 404 Not Found");
            require_once __DIR__ . '/views/404.php';
        }

    } else {
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
    } elseif ($route_parts[1] === 'seller' && isset($route_parts[2])) {
        if ($route_parts[2] === 'products' && $method === 'GET') {
            (new ProductController())->getProductBySeller();
        } elseif ($route_parts[2] === 'products' && ($route_parts[3] ?? '') === 'create' && $method === 'POST') {
            (new ProductController())->createProduct();
        } elseif ($route_parts[2] === 'product' && ($route_parts[3] ?? '') === 'delete' && $method === 'POST') {
            (new ProductController())->deleteProduct();
        } elseif ($route_parts[2] === 'products' && ($route_parts[3] ?? '') === 'update' && isset($route_parts[4]) && is_numeric($route_parts[4]) && $method === 'POST') {
            $id = (int)$route_parts[4];
            (new ProductController())->updateProduct($id);
            
        } else {
            Response::error('Seller API endpoint not found', null, 404);
        }
    } elseif ($route_parts[1] === 'cartcounter' && $method === 'GET') {
        $controller = new CartController();
        $controller->getUniqueItemCount();
    } elseif ($route_parts[1] === 'store') {
        $controller = new HomeController();
        if (isset($route_parts[2]) && $route_parts[2] === 'get-store-info' && $method === 'GET') {
            $controller->getStoreInfo();
        } elseif (isset($route_parts[2]) && $route_parts[2] === 'update' && $method === 'POST') {
            $controller->updateStore();
        } else {
            header("HTTP/1.0 404 Not Found");
            echo json_encode(['success' => false, 'message' => 'API endpoint not found']);
            exit;
        }
    } elseif ($route_parts[1] === 'orders') {
        $orderController = new OrderController();
        if (isset($route_parts[2]) && $route_parts[2] === 'detail' && $method === 'GET') {
            $orderController->getOrderDetail();
        } elseif (isset($route_parts[2]) && $route_parts[2] === 'approve' && $method === 'POST') {
            $orderController->approve();
        } elseif (isset($route_parts[2]) && $route_parts[2] === 'reject' && $method === 'POST') {
            $orderController->reject();
        } elseif (isset($route_parts[2]) && $route_parts[2] === 'delivery-time' && $method === 'POST') {
            $orderController->setDeliveryTime();
        } elseif ($method === 'GET' && !isset($route_parts[2])) {
            $orderController->getOrders();
        } else {
            header("HTTP/1.0 404 Not Found");
            echo json_encode(['success' => false, 'message' => 'API endpoint not found']);
            exit;
        }
    } elseif ($route_parts[1] === 'buyer-orders') {
        $homeController = new HomeController();
        if (isset($route_parts[2]) && $route_parts[2] === 'detail' && $method === 'GET') {
            $homeController->getBuyerOrderDetail();
        } elseif (isset($route_parts[2]) && $route_parts[2] === 'confirm' && $method === 'POST') {
            $homeController->confirmOrderReceived();
        } elseif ($method === 'GET' && !isset($route_parts[2])) {
            $homeController->getBuyerOrders();
        } else {
            header("HTTP/1.0 404 Not Found");
            echo json_encode(['success' => false, 'message' => 'API endpoint not found']);
            exit;
        }
    } else {
        header("HTTP/1.0 404 Not Found");
        echo json_encode(['success' => false, 'message' => 'API endpoint not found']);
        exit;
    }
} elseif ($route_parts[0] === 'product') {
    if (isset($route_parts[1]) && is_numeric($route_parts[1])) {
        $controller = new ProductController();
        if ($method === 'GET') {
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
        header('Location: /home');
        exit;
    } elseif ($route_parts[1] === 'profile') {
        $controller->buyerProfile();
    } elseif ($route_parts[1] === 'order-history') {
        if ($method === 'GET') {
            $controller->buyerOrderHistory();
        } else {
            Response::error('Method not allowed', null, 405);
        }
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
    } elseif ($route_parts[1] === 'export-performance' && $method === 'GET') {
        $controller->exportPerformanceReport();
    } elseif ($route_parts[1] === 'products' && $method === 'GET') {
        $productController = new ProductController();
        if (!isset($route_parts[2]) && $method === 'GET') {
            $productController->showProductManagement();
        } elseif (($route_parts[2] ?? '') === 'add' && $method === 'GET') {
            $productController->showAddProductPage();
        } elseif (($route_parts[2] ?? '') === 'edit' && isset($route_parts[3]) && is_numeric($route_parts[3]) && $method === 'GET') {
            $id = (int)$route_parts[3];
            $productController->showEditProductPage($id);
            
        } else {
            Response::error('Page not found', null, 404);
        }
    } elseif ($route_parts[1] === 'update-store' && $method === 'POST') {
        $controller->updateStore();
    } elseif ($route_parts[1] === 'orders') {
        $orderController = new OrderController();
        if ($method === 'GET') {
            $orderController->index();
        } else {
            Response::error('Method not allowed', null, 405);
        }
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
    $checkoutController = new CheckoutController();

    if ($method === 'GET') {
        $checkoutController->index();
    } elseif ($method === 'POST') {
        $checkoutController->checkout();
    } else {
        Response::error('Method not allowed', null, 405);
    }
} else {
    // Not Found
    header("HTTP/1.0 404 Not Found");
    require_once __DIR__ . '/views/404.php';
}

?>