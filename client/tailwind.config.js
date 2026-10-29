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
        finance: {
          dark: '#0B0F19',
          card: '#111827',
          cardSecondary: '#161F33',
          border: '#1F293D',
          hover: '#1D273D',
          accent: '#6366F1',
          accentHover: '#4F46E5',
          neonPurple: '#A855F7',
          neonCyan: '#06B6D4',
          matched: '#10B981',
          matchedBg: 'rgba(16, 185, 129, 0.12)',
          partial: '#F59E0B',
          partialBg: 'rgba(245, 158, 11, 0.12)',
          mismatch: '#EF4444',
          mismatchBg: 'rgba(239, 68, 68, 0.12)',
          review: '#8B5CF6',
          reviewBg: 'rgba(139, 92, 246, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(168, 85, 247, 0.25)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'glow-rose': '0 0 25px -5px rgba(239, 68, 68, 0.25)',
      }
    },
  },
  plugins: [],
}
