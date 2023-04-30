/** @type {import('tailwindcss').Config} */
export default {
  content: ["../**/*.html", "../**/*.tsx"],
  theme: {
    extend: {
      animation: {
        "page-in": "page .3s ease-out",
      },
      keyframes: {
        page: {
          "0%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
