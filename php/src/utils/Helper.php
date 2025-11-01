<?php

class Helper {

    public static function generatePaginLinks($currentPage, $totalPages, $window = 2) {
        $links = [];
        $showEllipsis = false;

        $links[] = [
            'type' => 'prev',
            'page' => $currentPage - 1,
            'disabled' => $currentPage <= 1
        ];

        for ($i = 1; $i <= $totalPages; $i++) {
            if ($i == 1 || $i == $totalPages || ($i >= $currentPage - $window && $i <= $currentPage + $window)) {
                $links[] = [
                    'type' => 'page',
                    'page' => $i,
                    'active' => $i == $currentPage
                ];
                $showEllipsis = true;
            } elseif ($showEllipsis) {
                $links[] = ['type' => 'ellipsis'];
                $showEllipsis = false;
            }
        }

        $links[] = [
            'type' => 'next',
            'page' => $currentPage + 1,
            'disabled' => $currentPage >= $totalPages
        ];

        return $links;
    }

    /**
     * Sanitize rich text from Quill.js editor
     * Allows safe formatting tags but removes dangerous content
     * Static method so it can be used across all controllers
     */
    public static function sanitizeRichText($html) {
        if (!is_string($html) || trim($html) === '') {
            return '';
        }

        // Define allowed HTML tags from Quill.js
        $allowedTags = '<p><strong><b><em><i><u><s><ol><ul><li><br><blockquote><span><a><h1><h2><h3>';
        
        // Strip all tags except allowed ones
        $clean = strip_tags($html, $allowedTags);

        // Remove empty paragraphs that Quill can generate
        $clean = preg_replace('/<p>\s*<\/p>/', '', $clean);
        
        // Remove any inline style attributes (for security)
        $clean = preg_replace('/\s+style\s*=\s*["\'][^"\']*["\']/', '', $clean);
        
        // Remove any onclick or other event handlers
        $clean = preg_replace('/\s+on\w+\s*=\s*["\'][^"\']*["\']/', '', $clean);
        
        return trim($clean);
    }
}