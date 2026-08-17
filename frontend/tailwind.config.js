/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Newsreader"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0A0B10',
          900: '#121420',
          850: '#171A26',
          800: '#1B1E2A',
          700: '#262A38',
          600: '#363B4C',
        },
        surface: {
          50: '#E7E8EE',
          100: '#F2F2F6',
        },
        violet: {
          50: '#F2F0FB',
          100: '#E3DEF7',
          200: '#C6BBEE',
          300: '#A594E4',
          400: '#8874D9',
          500: '#6E56CF',
          600: '#5A45B2',
          700: '#493790',
        },
        amber: {
          400: '#E3A768',
          500: '#D98A3E',
        },
        red: {
          400: '#E5878C',
          500: '#D9585E',
        },
        green: {
          400: '#5FBE93',
          500: '#3E9E74',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.2)',
        card: '0 6px 20px rgba(0,0,0,0.28)',
      },
    },
  },
  plugins: [],
};
