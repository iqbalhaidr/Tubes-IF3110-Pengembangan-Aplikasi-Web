<?php

require_once __DIR__ . '/../models/Category.php';

class HomeController {
    public function index() {
        $categories = Category::findAll();
        
        // Load the view
        require_once __DIR__ . '/../views/home.php';
    }
}
