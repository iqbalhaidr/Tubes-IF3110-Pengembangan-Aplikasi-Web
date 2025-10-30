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
}