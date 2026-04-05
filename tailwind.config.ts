import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        card: "#050505",
        cardBorder: "rgba(255, 255, 255, 0.12)",
        accent: "#2DD4BF",
      },
    },
  },
  plugins: [],
};

export default config;
