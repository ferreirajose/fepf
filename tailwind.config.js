/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores do Design System do Stitch
        primary: '#0057bd',
        'primary-container': '#6e9fff',
        secondary: '#006947',
        'secondary-container': '#69f6b8',
        tertiary: '#b51621',
        'tertiary-container': '#ff928b',
        surface: '#f7f5ff',
        'on-surface': '#242c51',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
