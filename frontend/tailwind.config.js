/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          50: '#fef7ff',
          100: '#fdeeff',
          200: '#fbd4ff',
          300: '#f8b1ff',
          400: '#f278ff',
          500: '#e845e8',
          600: '#d123d1',
          700: '#b115b1',
          800: '#911391',
          900: '#781078',
        },
        rainbow: {
          red: '#ff6b6b',
          orange: '#ffa726',
          yellow: '#ffeb3b',
          green: '#4caf50',
          blue: '#2196f3',
          indigo: '#3f51b5',
          purple: '#9c27b0',
          pink: '#e91e63',
          cyan: '#00bcd4',
          lime: '#8bc34a',
        },
        gradient: {
          'rainbow-start': '#ff6b6b',
          'rainbow-mid': '#4ecdc4',
          'rainbow-end': '#45b7d1',
          'sunset-start': '#ff9a9e',
          'sunset-end': '#fecfef',
          'ocean-start': '#667eea',
          'ocean-end': '#764ba2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}