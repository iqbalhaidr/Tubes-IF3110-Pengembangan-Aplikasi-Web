/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'spinner-rotate': {
          to: { transform: 'rotate(360deg)' },
        },
        'modal-fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'modal-slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'toast-slide-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'skeleton-shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'spinner': 'spinner-rotate 0.8s linear infinite',
        'modal-fade': 'modal-fade-in 0.2s ease-out',
        'modal-slide': 'modal-slide-up 0.3s ease-out',
        'toast-slide': 'toast-slide-in 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'skeleton': 'skeleton-shimmer 1.5s infinite',
      },
      colors: {
        // Primary colors - Tokopedia inspired
        'primary-green': '#03ac0e',
        'primary-green-hover': '#028a0c',
        'dark-green': '#00a000',

        // Text colors
        'text-dark': '#333333',
        'text-medium': '#666666',
        'text-light': '#999999',
        'text-muted': '#cccccc',

        // Background colors
        'background-gray': '#f5f5f5',
        'background-light': '#f9f9f9',
        'page-background': '#F5F5F5',

        // Legacy aliases for compatibility
        'main-text': '#333333',
        'secondary-text': '#757575',

        // Accent colors
        'error-red': '#dc3545',
        'success-green': '#03ac0e',
        'warning-orange': '#ff9800',
        'info-blue': '#2196F3',

        // Border colors
        'border-color': '#dddddd',
        'border-light': '#eeeeee',
      },
      borderRadius: {
        'card': '8px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: ['Open Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


