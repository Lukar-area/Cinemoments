/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cinema: {
          950: '#070A0F',
          900: '#0B0F17',
          850: '#101622',
          800: '#151D2C',
          700: '#1E293B',
          600: '#2A374A',
          gold: '#F59E0B',
          'gold-light': '#FBBF24',
          red: '#E50914',
          'red-hover': '#B80710',
          amber: '#D97706',
        }
      },
      boxShadow: {
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-red': '0 0 25px -5px rgba(229, 9, 20, 0.4)',
        'glow-screen': '0 15px 40px -10px rgba(56, 189, 248, 0.25)',
      }
    },
  },
  plugins: [],
}
