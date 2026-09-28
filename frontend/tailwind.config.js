/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#15251f",
        muted: "#718078",
        secondary: "#40554a",
        canvas: "#fbfcfa",
        surface: "#ffffff",
        sidebar: "#f7f8f6",
        line: "#e7ece7",
        accent: "#174f3b",
        "accent-hover": "#103d2c",
        focus: "#38705a",
        active: "#e6f5ea",
        hover: "#edf0ec",
        danger: "#9b2c2c",
        "danger-soft": "#fff1f1",
        disabled: "#9aaa9f",
        "user-message": "#174f3b",
        "user-message-text": "#ffffff",
      },
      borderRadius: {
        control: "8px",
        card: "12px",
        bubble: "12px",
      },
      maxWidth: {
        chat: "720px",
      },
      boxShadow: {
        panel: "0 24px 80px -36px rgba(15, 23, 42, 0.22)",
      },
    },
  },
  plugins: [],
};
