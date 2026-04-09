/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0D0D0D",
          card: "#1A1A1A",
          elevated: "#242424",
          hover: "#2A2A2A",
          input: "#1A1A1A",
        },
        toss: {
          blue: "#3182F6",
          "blue-light": "#4A95F7",
          "blue-dim": "rgba(49, 130, 246, 0.12)",
          "blue-dimmer": "rgba(49, 130, 246, 0.06)",
        },
        txt: {
          primary: "#FFFFFF",
          secondary: "#8B8B8B",
          tertiary: "#555555",
          disabled: "#3A3A3A",
        },
        line: {
          primary: "#2A2A2A",
          secondary: "#1F1F1F",
        },
        status: {
          danger: "#F45452",
          warn: "#F5A623",
          safe: "#1CD98C",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
