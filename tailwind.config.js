/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arduino: {
          teal: "#00979D",
          darkTeal: "#008184",
          orange: "#E47128",
          yellow: "#E5AD23",
          dark: "#1E293B",
          panel: "#0F172A",
          border: "#334155",
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
