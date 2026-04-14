import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy palette — retained so admin UI continues to work
        midnight: "#0a1628",
        deep: "#0f4e77",
        ocean: "#3a7ca5",
        sage: "#2f4420",
        cream: "#f6f4f1",
        gold: "#d4a843",
        warmGray: "#b8b0a4",
        softBlue: "#86a3b3",
        coral: "#c4725a",
        // Sunset palette — public site redesign (suffix "2" to avoid collision)
        cream2: "#FFF8F2",
        deepBrown: "#5B2A1A",
        midBrown: "#8B4A2A",
        warmRust: "#D4704A",
        rustPale: "#FAE0D0",
        gold2: "#E8A838",
        goldLight: "#F5CA6A",
        goldPale: "#FDF0D0",
        coral2: "#C45030",
        coralLight: "#E0887A",
        coralPale: "#FCE8E3",
        forest: "#4A6B3A",
        forestLight: "#7A9B6A",
        forestPale: "#E0ECDA",
        sage2: "#8B7355",
        sageLight: "#BFA88A",
        sagePale: "#EDE4D8",
        cardCream: "#F5EDD4",
        cardBorder: "#B8A070",
        ink: "#1A1A1A",
      },
      fontFamily: {
        heading: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-outfit)", "-apple-system", "sans-serif"],
        display: ["var(--font-syne)", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
