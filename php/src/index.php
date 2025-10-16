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

    // Look in utils
    $util_file = __DIR__ . '/utils/' . $class_name . '.php';
    if (file_exists($util_file)) {
        require_once $util_file;
        return;
    }
});


// Routing
if ($uri === '/' || $uri === '/index.php') {
    $controller = new HomeController();
    $controller->index();
} else {
    // Not Found
    header("HTTP/1.0 404 Not Found");
    require_once __DIR__ . '/views/404.php';
}

?>