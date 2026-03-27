/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        legal: {
          900: '#0f172a', // Deep Navy
          800: '#1e293b',
          DEFAULT: '#334155',
          gold: '#c5a059', // Muted Gold
          copper: '#b45309',
          cream: '#f8fafc',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      spacing: {
        'golden': '1.618rem',
      },
    },
  },
  plugins: [],
}
