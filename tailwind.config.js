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
        gold: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
        },
        orange: {
          50: '#FCF9F0',
          100: '#F7F1DD',
          200: '#EFE4BF',
          300: '#E5D4A0',
          400: '#DEC782',
          500: 'var(--primary)',
          600: 'var(--primary-hover)',
          700: '#D6B54D',
          800: 'var(--primary-dark)',
          900: '#8E731F',
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