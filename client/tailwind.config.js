/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#030611',
          900: '#060b1e',
          850: '#0a102b',
          800: '#0e173b',
          750: '#14214f',
          700: '#1b2c65',
        },
        cyber: {
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          purple: '#a855f7',
          emerald: '#10b981',
          gold: '#f59e0b',
          rose: '#f43f5e',
          neon: '#22d3ee',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'hud-grid': "radial-gradient(circle, rgba(99, 102, 241, 0.08) 1px, transparent 1px)",
        'cyber-gradient': "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)",
        'glow-radial': "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 16px rgba(6, 182, 212, 0.6))' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      }
    },
  },
  plugins: [],
}
