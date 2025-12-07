/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#03ac0e', // Bright Green accent
        'page-background': '#F5F5F5', // Light Gray page background
        'main-text': '#333333', // Dark gray/black for main text
        'secondary-text': '#757575', // Medium gray for secondary labels/borders
      },
      borderRadius: {
        'card': '8px', // Slightly rounded corners for cards
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)', // Subtle drop shadow
      }
    },
  },
  plugins: [],
}


