/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f9ff',
          100: '#b3f0ff',
          200: '#80e5ff',
          300: '#4dd9ff',
          400: '#1aceff',
          500: '#00d4ff',
          600: '#00b8e6',
          700: '#0090b2',
          800: '#006880',
          900: '#003040',
        },
        cyber: {
          bg: '#060d1f',
          surface: '#0d1830',
          card: '#0f1f3a',
          border: '#1a3055',
          glow: '#00d4ff',
          purple: '#8b5cf6',
          green: '#00ffa3',
          red: '#ff4466',
          yellow: '#ffd600',
          orange: '#ff7a00',
        },
        surface: {
          DEFAULT: '#0d1830',
          secondary: '#060d1f',
          tertiary: '#0f1f3a',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00d4ff, 0 0 20px #00d4ff44',
        'neon-purple': '0 0 10px #8b5cf6, 0 0 20px #8b5cf644',
        'neon-green': '0 0 10px #00ffa3, 0 0 20px #00ffa344',
        'card-cyber': '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,212,255,0.1)',
      },
      backgroundImage: {
        'cyber-grid':
          'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        'cyber-gradient':
          'linear-gradient(135deg, #060d1f 0%, #0d1830 50%, #060d1f 100%)',
        'glow-radial':
          'radial-gradient(circle at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid-40': '40px 40px',
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px #00d4ff44, 0 0 10px #00d4ff22' },
          '50%': { boxShadow: '0 0 20px #00d4ff, 0 0 40px #00d4ff88, 0 0 60px #00d4ff44' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
