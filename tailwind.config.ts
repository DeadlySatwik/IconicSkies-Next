import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        skyInk: "#102022",
        night: "#071417",
        cloud: "#edf5f2",
        mist: "#dce9e5",
        horizon: "#d88a4b",
        rain: "#38767a",
        aurora: "#7bc6a4",
        warning: "#b45309",
        danger: "#b42318",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(16, 32, 34, 0.10)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [forms],
};

export default config;
