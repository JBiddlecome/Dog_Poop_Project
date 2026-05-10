/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream:  '#FAF8F3',
        ink:    '#1E1D1A',
        sage:   { DEFAULT: '#4A7C59', light: '#D4E8DA', dark: '#2E5438' },
        gold:   { DEFAULT: '#C8973A', light: '#FDF3E0', dark: '#8A6220' },
        mauve:  { DEFAULT: '#7A6B8A', light: '#EDE9F3' },
        muted:  '#888780',
        rule:   '#D4CFC5',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)',    'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
