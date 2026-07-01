/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fff7ed",
        latte: "#f6d7b0",
        caramel: "#d97706",
        coffee: "#6f4e37",
        cocoa: "#3f2d24",
        mint: "#d7f5dc",
        roseMilk: "#ffe4e6"
      },
      boxShadow: { soft: "0 18px 50px rgba(111,78,55,0.16)" },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] }
    }
  },
  plugins: []
};
