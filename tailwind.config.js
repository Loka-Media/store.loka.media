/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: {
          DEFAULT: 'var(--foreground)',
          muted: 'var(--foreground-muted)',
        },
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          active: 'var(--primary-active)',
          light: 'var(--primary-light)',
          tint: 'var(--primary-tint)',
          dark: 'var(--primary-dark)',
          deep: 'var(--primary-deep)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        orange: {
          50: '#E6FDF1',
          100: '#C7FBE0',
          200: '#A5F9D0',
          300: '#69F3AC',
          400: '#32E788',
          500: 'var(--primary)',
          600: 'var(--primary-hover)',
          700: '#03A854',
          800: 'var(--primary-dark)',
          900: '#015B2D',
          950: 'var(--primary-deep)',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        manrope: ['var(--font-manrope)', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0em',
      },
    },
  },
  plugins: [],
}