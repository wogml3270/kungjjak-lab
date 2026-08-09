/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#FF9EAA',
          blue: '#A0E9FF',
          yellow: '#FFD966',
          mint: '#C1ECE4',
          bg: '#FFF8F0',
        },
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        neo: '4px 4px 0 0 #000000',
        'neo-lg': '6px 6px 0 0 #000000',
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
