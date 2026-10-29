/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'teal': {
          50: '#edf7f4',
          100: '#d9eee8',
          600: '#176b64',
          700: '#125b54',
          800: '#104c47',
          900: '#0e3e3a',
        },
        'primary': '#176B64',     // Deep teal
        'primary-dark': '#0E4E49', // Dark teal
        'cream': {
          50: '#f7faf8',
          100: '#edf4f0',
          200: '#e8f0ec',
          300: '#ffe8cc',
          400: '#ffd699',
        },
        'surface': {
          50: '#fafaf8',
          100: '#f5f5f3',
          200: '#f0f0ed',
          300: '#dce7e1',
        },
        'charcoal': '#2c2c2c',    // Deep Charcoal (Text)
        'grey': {
          400: '#5f6f69',
          500: '#53635d',
          600: '#485851',
        },
        'success': '#2d5016',      // Forest Green
        'success-light': '#4ade80',
      },
      backgroundColor: {
        'page': '#f3f7f5',
        'card': '#ffffff',
      },
      textColor: {
        'primary': '#2c2c2c',      // Deep Charcoal
        'secondary': '#53635d',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(20, 48, 40, 0.06)',
        'md': '0 8px 20px rgba(20, 48, 40, 0.08)',
        'lg': '0 16px 36px rgba(20, 48, 40, 0.12)',
        'xl': '0 24px 56px rgba(20, 48, 40, 0.16)',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
