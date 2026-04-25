/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          200: '#f0dfa0',
          300: '#e8d49c',
          400: '#d4af37',
          500: '#c9a047',
          600: '#b8882a',
          700: '#9a6e1e',
          800: '#7a5518',
        },
        surface: {
          900: '#07070d',
          800: '#0d0d1a',
          700: '#12121f',
          600: '#181828',
          500: '#1e1e30',
          400: '#252538',
        },
        cream: {
          50:  '#fdfaf4',
          100: '#f5f0e8',
          200: '#e8dfc8',
          300: '#d4c8a4',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.35s ease-out',
        'slide-right':  'slideInRight 0.35s ease-out',
        'pulse-gold':   'pulseGold 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(18px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(110%)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,160,71,0.25)' },
          '50%':      { boxShadow: '0 0 0 10px rgba(201,160,71,0)' },
        },
      },
    },
  },
  plugins: [],
};
