/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-green': '#0a0a0a',
        'accent-green': '#10b981',
        'deep-green': '#064e3b',
        'forest-green': '#065f46',
        'charcoal': '#0a0a0a',
        'slate-dark': '#000000',
        'neon-green': '#10b981',
        'dark-neon': '#059669',
        'eerie-black': '#0a0a0a',
        'void-black': '#000000',
        'glass-white': 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'terminal-bg': '#0f0f0f',
        'terminal-text': '#d1d5db',
        'terminal-accent': '#10b981',
        'terminal-muted': '#6b7280',
        'terminal-border': '#374151',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Inter', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s ease-in-out infinite',
        'matrix': 'matrix 20s linear infinite',
        'glitch': 'glitch 0.3s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 1.5s infinite alternate',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        matrix: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'neon-flicker': {
          '0%': { textShadow: '0 0 2px #10b981, 0 0 4px #10b981' },
          '100%': { textShadow: '0 0 1px #10b981, 0 0 2px #10b981' },
        },
      },
    },
  },
  plugins: [],
}
