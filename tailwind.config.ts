import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        "card-hover": "var(--color-card-hover)",
        border: "var(--color-border)",
        "border-hover": "var(--color-border-hover)",
        fg: "var(--color-fg)",
        muted: "var(--color-muted)",
        dim: "var(--color-dim)",
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          tint: "rgba(59,130,246,0.10)",
        },
        accent: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          tint: "rgba(139,92,246,0.10)",
        },
        success: {
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          tint: "rgba(34,197,94,0.10)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "glow-blue": "0 0 60px rgba(59,130,246,0.25)",
        "glow-purple": "0 0 60px rgba(139,92,246,0.25)",
        "btn-blue": "0 8px 30px -6px rgba(59,130,246,0.45)",
        "btn-purple": "0 8px 30px -6px rgba(139,92,246,0.45)",
        card: "0 0 0 1px var(--color-border), 0 2px 12px rgba(0,0,0,0.2)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
        "gradient-brand-soft":
          "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.12) 100%)",
        "radial-brand":
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.12), transparent 70%)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
