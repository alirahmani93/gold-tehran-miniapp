import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"],
      },
      colors: {
        gold: {
          50: "#fdf8ec",
          100: "#faedc7",
          200: "#f4d98c",
          300: "#edc04e",
          400: "#e7a824",
          500: "#d68a14",
          600: "#b96a0f",
          700: "#944c10",
          800: "#7a3d14",
          900: "#683316",
        },
      },
    },
  },
  plugins: [],
};

export default config;
