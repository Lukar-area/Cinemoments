/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        cinema: ['Cinzel', 'serif'],
        'cinema-dec': ['"Cinzel Decorative"', 'Cinzel', 'serif'],
        marquee: ['"Bebas Neue"', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // User requested palette
        amaranth: {
          DEFAULT: '#9F2B68',
          light: '#BA3E7F',
          dark: '#7D2252',
        },
        'bright-purple': {
          DEFAULT: '#BF40BF',
          light: '#D066D0',
          dark: '#9A2B9A',
        },
        burgundy: {
          DEFAULT: '#800020',
          light: '#9E0A2D',
          dark: '#5E0017',
        },
        byzantium: {
          DEFAULT: '#702963',
          light: '#8C387D',
          dark: '#541E4B',
        },
        'dark-pink': {
          DEFAULT: '#AA336A',
          light: '#C34B83',
          dark: '#872552',
        },
        'dark-purple': {
          DEFAULT: '#301934',
          light: '#46274C',
          dark: '#201023',
        },
        eggplant: {
          DEFAULT: '#483248',
          light: '#5E435E',
          dark: '#352435',
        },
        iris: {
          DEFAULT: '#5D3FD3',
          light: '#7A60DE',
          dark: '#452CA8',
        },
        lavender: {
          DEFAULT: '#E6E6FA',
          light: '#F3F3FD',
          dark: '#D4D4F5',
        },
        'light-purple': {
          DEFAULT: '#CBC3E3',
          light: '#DDD7EC',
          dark: '#B7ACD7',
        },
        'light-violet': {
          DEFAULT: '#CF9FFF',
          light: '#DEBCFF',
          dark: '#BA80FC',
        },
        lilac: {
          DEFAULT: '#AA98A9',
          light: '#C1B3C0',
          dark: '#8D7B8C',
        },
        mauve: {
          DEFAULT: '#E0B0FF',
          light: '#EBC4FF',
          dark: '#CA93F5',
        },
        'mauve-taupe': {
          DEFAULT: '#915F6D',
          light: '#A97584',
          dark: '#744A56',
        },
        mulberry: {
          DEFAULT: '#770737',
          light: '#931249',
          dark: '#580428',
        },
        orchid: {
          DEFAULT: '#DA70D6',
          light: '#E48FE0',
          dark: '#BE50BA',
        },
        'pastel-purple': {
          DEFAULT: '#C3B1E1',
          light: '#D6C8EB',
          dark: '#AB97D1',
        },
        periwinkle: {
          DEFAULT: '#CCCCFF',
          light: '#E2E2FF',
          dark: '#B5B5F5',
        },

        // Mapped cinema palette in White + Amaranth + Royal Purple system
        cinema: {
          black: '#FAFAFE', // Base pearl white
          950: '#FFFFFF',   // Pure crystalline white
          900: '#F6F3FC',   // Very soft lavender-white
          850: '#EFEAF8',   // Soft lavender tint
          800: '#E4DCF2',   // Muted lavender card border
          700: '#CBC3E3',   // Light purple border
          600: '#AA98A9',   // Lilac neutral
          gold: '#9F2B68',  // Primary accent is now vibrant Amaranth!
          'gold-light': '#DA70D6', // Orchid secondary
          'gold-dark': '#770737',  // Mulberry deep
          red: '#800020',   // Burgundy royal red
          'red-hover': '#9E0A2D',
          amber: '#BF40BF', // Bright Purple highlight
          neon: '#5D3FD3',  // Iris electric
          velvet: '#800020', // Burgundy velvet
        }
      },
      boxShadow: {
        'glow-amaranth': '0 0 30px -5px rgba(159, 43, 104, 0.45)',
        'glow-purple': '0 0 30px -5px rgba(191, 64, 191, 0.45)',
        'glow-iris': '0 0 30px -5px rgba(93, 63, 211, 0.4)',
        'glow-screen': '0 20px 70px -10px rgba(159, 43, 104, 0.25)',
        'glow-gold': '0 0 30px -5px rgba(159, 43, 104, 0.45)',
        'glow-red': '0 0 30px -5px rgba(128, 0, 32, 0.45)',
        'glow-cinema': '0 10px 35px -5px rgba(159, 43, 104, 0.2), 0 0 20px rgba(93, 63, 211, 0.1)',
        'marquee': '0 0 25px rgba(159, 43, 104, 0.2), inset 0 0 15px rgba(191, 64, 191, 0.08)',
        'card-soft': '0 10px 30px -8px rgba(48, 25, 52, 0.08), 0 2px 8px -2px rgba(48, 25, 52, 0.04)',
        'card-hover': '0 20px 40px -12px rgba(159, 43, 104, 0.2), 0 4px 16px -4px rgba(93, 63, 211, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'beam': 'beam 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        beam: {
          '0%, 100%': { opacity: '0.6', transform: 'scaleX(1)' },
          '50%': { opacity: '0.85', transform: 'scaleX(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
