/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.liquid',
    './sections/**/*.liquid',
    './snippets/**/*.liquid',
    './layout/**/*.liquid',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 