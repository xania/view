/** @type {import('tailwindcss').Config} */
export default {
  content: ["../**/*.html", "../**/*.tsx"],
  theme: {
    extend: {
      animation: {
        "page-in": "page-in .3s ease-out",
        "page-out": "page-out .3s ease-out",
      },
      keyframes: {
        'page-in': {
          "0%": { transform: "translateX(100%)" },
        },
        'page-out': {
          "100%": { transform: "translateX(-50%)", 'background-color': 'black', opacity: '20%' },
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
