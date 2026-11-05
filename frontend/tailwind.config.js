/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#151a3d',
        navy: { 800: '#141a40', 900: '#0f1433' },
        brand: { 50: '#f3f1ff', 100: '#e8e5ff', 200: '#d3ceff', 500: '#6a5af9', 600: '#5b49f0', 700: '#4b3bd6' },
      },
      boxShadow: { card: '0 1px 2px rgba(21,26,61,.04), 0 6px 20px rgba(21,26,61,.05)' },
    },
  },
  plugins: [],
};
