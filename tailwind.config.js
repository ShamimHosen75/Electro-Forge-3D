/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#ebe5d9',
        paper: '#f5f0e6',
        card: '#f8f4ec',
        line: '#ddd3c2',
        ink: '#1e1b17',
        muted: '#8b8275',
        forge: { DEFAULT: '#c8372d', soft: '#f6dcd6' },
        ok: { DEFAULT: '#2f8a5b', soft: '#e1f1e7' },
        warn: { DEFAULT: '#c4861b', soft: '#f7e9c9' },
        wire: { DEFAULT: '#2f62b8', soft: '#e1e9f7' },
        swap: { DEFAULT: '#7c4bc0', soft: '#ece3f8' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 0 rgba(255,255,255,.7) inset, 0 6px 20px -8px rgba(60,45,25,.25), 0 1px 3px rgba(60,45,25,.12)',
      },
      keyframes: {
        cardIn: {
          '0%': { opacity: '0', transform: 'translateY(-14px) scale(.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        flash: {
          '0%': { boxShadow: '0 0 0 0 rgba(200,55,45,.35)' },
          '100%': { boxShadow: '0 0 0 10px rgba(200,55,45,0)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, 8px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
      },
      animation: {
        cardIn: 'cardIn .45s cubic-bezier(.2,.8,.2,1) both',
        flash: 'flash 1.2s ease-out 1',
        toastIn: 'toastIn .25s ease-out both',
      },
    },
  },
  plugins: [],
};
