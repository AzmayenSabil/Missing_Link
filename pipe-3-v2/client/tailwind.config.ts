import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cyber cyan primary
        primary: {
          50: "#e0faff",
          100: "#b3f3ff",
          200: "#80ecff",
          300: "#4de4ff",
          400: "#26deff",
          500: "#00d4ff",
          600: "#00b8d9",
          700: "#009bb3",
          800: "#007f8c",
          900: "#005f66",
        },
        // Purple accent
        accent: {
          50: "#f0ebff",
          100: "#d9ccff",
          200: "#c2aaff",
          300: "#ab88ff",
          400: "#9a6dff",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        // Dark surfaces
        surface: {
          DEFAULT: "#0a1628",
          secondary: "#060d1f",
          tertiary: "#0d1e35",
          elevated: "#112240",
        },
        // Neon green
        neon: {
          green: "#00ffa3",
          cyan: "#00d4ff",
          purple: "#8b5cf6",
          amber: "#f59e0b",
          red: "#ff4466",
        },
        cyber: {
          border: "#1a3055",
          "border-glow": "#00d4ff33",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "ui-monospace", "monospace"],
      },
      animation: {
        scan: "scanBeam 2.5s linear infinite",
        "spin-cw": "spinCW 3s linear infinite",
        "spin-ccw": "spinCCW 2s linear infinite",
        "bar-pulse": "barPulse 1.1s ease-in-out infinite",
        float: "floatUp 4s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "slide-up": "slideUp 0.4s ease-out both",
        "neon-flicker": "neonFlicker 3s ease-in-out infinite",
      },
      keyframes: {
        scanBeam: {
          "0%": { top: "-4px", opacity: "0" },
          "5%": { opacity: "1" },
          "95%": { opacity: "0.8" },
          "100%": { top: "100%", opacity: "0" },
        },
        spinCW: { to: { transform: "rotate(360deg)" } },
        spinCCW: { to: { transform: "rotate(-360deg)" } },
        barPulse: {
          "0%,100%": { transform: "scaleY(0.4)", opacity: "0.4" },
          "50%": { transform: "scaleY(1)", opacity: "1" },
        },
        floatUp: {
          "0%,100%": { transform: "translateY(0px)", opacity: "0.6" },
          "50%": { transform: "translateY(-12px)", opacity: "1" },
        },
        glowPulse: {
          "0%,100%": { boxShadow: "0 0 4px #00d4ff44" },
          "50%": { boxShadow: "0 0 20px #00d4ff, 0 0 40px #00d4ff44" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        neonFlicker: {
          "0%,100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.4" },
          "94%": { opacity: "1" },
          "96%": { opacity: "0.6" },
          "97%": { opacity: "1" },
        },
      },
      boxShadow: {
        "neon-sm": "0 0 8px #00d4ff44",
        "neon-md": "0 0 16px #00d4ff66",
        "neon-lg": "0 0 32px #00d4ff44, 0 0 64px #00d4ff22",
        "neon-purple-sm": "0 0 8px #8b5cf644",
        "neon-green-sm": "0 0 8px #00ffa344",
        "cyber-card":
          "0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,212,255,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
