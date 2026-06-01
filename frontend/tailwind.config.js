export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        input: "var(--input)",
        border: "var(--border)",
        line: "var(--line)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        muted: "var(--muted)",
        "muted-2": "var(--muted-2)",
        faint: "var(--faint)",
        ember: "var(--ember)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        "accent-wash": "var(--accent-wash)",
        "accent-glow": "var(--accent-glow)",
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        ui: ["Spectral", "Georgia", "serif"],
        num: ["Oswald", "sans-serif"],
      },
    },
  },
  plugins: [],
};
