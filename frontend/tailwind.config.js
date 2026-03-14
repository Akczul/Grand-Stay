/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1e3a5f',
          600: '#1a3353',
          700: '#162b47',
          800: '#12233b',
          900: '#0e1b2f',
        },
        hotel: {
          gold: '#d4a853',
          cream: '#faf8f5',
          dark: '#1e3a5f',
        },
      },
    },
  },
  plugins: [],
};
