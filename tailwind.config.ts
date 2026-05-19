import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0A0A0A",
        safety: "#FF5733",
        success: "#10B981",
        blood: "#EF4444"
      },
      fontFamily: {
        sans: [
          "var(--font-body)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI Variable",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        display: [
          "var(--font-display)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI Variable Display",
          "Segoe UI Variable",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ]
      },
      boxShadow: {
        orange: "0 0 40px rgba(255, 87, 51, 0.18)",
        green: "0 0 40px rgba(16, 185, 129, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
