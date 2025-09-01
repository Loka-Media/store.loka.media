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
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        'fascinate': ['var(--font-fascinate-inline)', 'system-ui'],
        'michroma': ['var(--font-michroma)', 'sans-serif'],
        'delius': ['var(--font-delius)', 'cursive'],
        'sansation': ['"Sansation"', 'sans-serif'],
        'sans': ['"Sansation"', 'sans-serif'],
        'mono': ['var(--font-geist-mono)', 'monospace'],
        'heading': ['var(--font-fascinate-inline)', 'system-ui'],
      },
    },
  },
  plugins: [],
}