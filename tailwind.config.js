/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: { bg: '#0f1117', panel: '#171a23', border: '#262a36' },
        accent: { DEFAULT: '#4f8cff', hover: '#3a76e8' },
        adminAccent: { DEFAULT: '#8b5cf6', hover: '#7c3aed' }
      }
    }
  },
  plugins: []
};
