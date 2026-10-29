/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        chalk: "#f0f3ef",
        teal: { ink: "#0b3a3c", deep: "#0f4c4e", mid: "#17696b", soft: "#d9e9e6" },
        marigold: { DEFAULT: "#f2b134", soft: "#fdf1d3", ink: "#7a5200" },
        stockin: { DEFAULT: "#1b8a5a", soft: "#dcf1e6" },
        stockout: { DEFAULT: "#c4432b", soft: "#fbe3dd" },
        line: "#dde3de",
        muted: "#5d6b66",
        ink: "#10201f",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
        sans: ['"Instrument Sans Variable"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "monospace"],
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
