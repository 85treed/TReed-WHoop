import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        whoop: {
          bg: "#0a0a0d",
          panel: "#141419",
          border: "#24242c",
          strain: "#00c9ff",
          recovery: {
            high: "#16ec06",
            mid: "#ffde00",
            low: "#ff0026",
          },
          sleep: "#7c5cff",
        },
      },
    },
  },
  plugins: [],
};

export default config;
