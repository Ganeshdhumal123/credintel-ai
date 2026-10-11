/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fintech-navy': '#0A192F',
        'fintech-teal': '#64FFDA',
      }
    },
  },
  plugins: [],
}
