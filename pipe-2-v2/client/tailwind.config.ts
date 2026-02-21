import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e0f9ff",
          100: "#b3efff",
          200: "#7de4ff",
          300: "#38d5ff",
          400: "#00c4f0",
          500: "#00afd6",
          600: "#0090b2",
          700: "#006e88",
          800: "#004f63",
          900: "#003040",
        },
        cyber: {
          bg: "#060d1f",
          surface: "#0d1830",
          card: "#0f1f3a",
          border: "#1a3055",
          glow: "#00d4ff",
          purple: "#8b5cf6",
          green: "#00ffa3",
          red: "#ff4466",
          yellow: "#ffd600",
          orange: "#ff7a00",
        },
        surface: {
          DEFAULT: "#0d1830",
          secondary: "#060d1f",
          tertiary: "#0f1f3a",
        },
        chat: {
          ai: "#0f1f3a",
          user: "#0090b2",
        },
      },
      animation: {
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "scan-line": "scanLine 2.5s linear infinite",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin 4s linear infinite",
        orbit: "orbit 3s linear infinite",
        "data-stream": "dataStream 1.5s ease-in-out infinite",
        "neon-flicker": "neonFlicker 3s ease-in-out infinite",
        "progress-glow": "progressGlow 1.5s ease-in-out infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounceSub 1.5s ease-in-out infinite",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": {
            boxShadow: "0 0 5px #00d4ff44, 0 0 10px #00d4ff22",
            borderColor: "#00d4ff44",
          },
          "50%": {
            boxShadow:
              "0 0 20px #00d4ff, 0 0 40px #00d4ff88, 0 0 60px #00d4ff44",
            borderColor: "#00d4ff",
          },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(2000%)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(20px) rotate(0deg)" },
          "100%": {
            transform: "rotate(360deg) translateX(20px) rotate(-360deg)",
          },
        },
        dataStream: {
          "0%": { opacity: "0.3", transform: "scaleX(0.8)" },
          "50%": { opacity: "1", transform: "scaleX(1)" },
          "100%": { opacity: "0.3", transform: "scaleX(0.8)" },
        },
        neonFlicker: {
          "0%, 100%": { textShadow: "0 0 8px #00d4ff, 0 0 16px #00d4ff" },
          "25%": { textShadow: "none" },
          "50%": {
            textShadow: "0 0 8px #00d4ff, 0 0 20px #00d4ff, 0 0 40px #00d4ff66",
          },
          "75%": { textShadow: "0 0 4px #00d4ff" },
        },
        progressGlow: {
          "0%, 100%": { boxShadow: "0 0 6px #00d4ff" },
          "50%": { boxShadow: "0 0 16px #00d4ff, 0 0 30px #00d4ff66" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceSub: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        "cyber-gradient":
          "linear-gradient(135deg, #060d1f 0%, #0d1830 50%, #060d1f 100%)",
        "glow-radial":
          "radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)",
      },
      backgroundSize: {
        "cyber-grid": "40px 40px",
      },
      boxShadow: {
        "neon-cyan": "0 0 10px #00d4ff, 0 0 20px #00d4ff44",
        "neon-purple": "0 0 10px #8b5cf6, 0 0 20px #8b5cf644",
        "neon-green": "0 0 10px #00ffa3, 0 0 20px #00ffa344",
        "card-cyber":
          "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,212,255,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
