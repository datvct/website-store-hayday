/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#24342b",
        cream: "#f8f5ec",
        paper: "#fffdf7",
        farm: "#2f7d53",
        "farm-dark": "#205a3a",
        mint: "#e8f2e7",
        wheat: "#f6c453",
        orange: "#e98943",
        danger: "#c75a4a",
      },
      fontFamily: {
        sans: ["DM Sans", "Avenir Next", "sans-serif"],
        display: ["Nunito", "sans-serif"],
      },
      boxShadow: { soft: "0 18px 50px rgba(45, 72, 52, .10)" },
    },
  },
  plugins: [],
};
