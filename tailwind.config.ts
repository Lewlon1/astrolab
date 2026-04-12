import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0a1628",
        deep: "#0f4e77",
        ocean: "#3a7ca5",
        sage: "#2f4420",
        cream: "#f6f4f1",
        gold: "#d4a843",
        warmGray: "#b8b0a4",
        softBlue: "#86a3b3",
        coral: "#c4725a",
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
