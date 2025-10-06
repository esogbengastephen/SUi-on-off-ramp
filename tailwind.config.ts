import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "bg-gray-50",
    "bg-gray-900", 
    "bg-white",
    "bg-gray-800",
    "bg-gray-700",
    "text-gray-900",
    "text-gray-100",
    "text-gray-600",
    "text-gray-400",
    "border-gray-200",
    "border-gray-600",
    "border-gray-700",
    "font-display",
    "bg-primary",
    "text-white",
    "bg-blue-600",
    "bg-slate-200",
    "bg-slate-700",
    "hover:bg-slate-300",
    "hover:bg-slate-600",
    "bg-blue-50",
    "bg-blue-900",
    "text-blue-800",
    "text-blue-200",
    "border-blue-200",
    "border-blue-800",
    "focus:ring-primary",
    "focus:border-primary",
    "focus:ring-offset-gray-50",
    "focus:ring-offset-gray-900",
    "focus:ring-primary"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#007BFF",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
