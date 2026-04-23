/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary, #0EA5E9)',
          primary: 'var(--brand-primary, #0EA5E9)',
          accent: 'var(--brand-accent, #F59E0B)',
        },
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}
