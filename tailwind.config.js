/** @type {import('tailwindcss').Config} */

// Colors are declared as space-separated RGB channels in index.css (:root / .dark)
// and consumed with <alpha-value> so `bg-surface/60`, `text-accent/40` etc. all work.
const withAlpha = (v) => `rgb(var(${v}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: withAlpha('--canvas'),
        surface: withAlpha('--surface'),
        elevated: withAlpha('--elevated'),
        subtle: withAlpha('--subtle'),
        line: withAlpha('--line'),
        fg: withAlpha('--fg'),
        muted: withAlpha('--muted'),
        faint: withAlpha('--faint'),
        accent: withAlpha('--accent'),
        'accent-soft': withAlpha('--accent-soft'),
        gain: withAlpha('--gain'),
        loss: withAlpha('--loss'),
        warn: withAlpha('--warn'),
        gold: withAlpha('--gold'),
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"',
          '"PingFang SC"', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'system-ui', 'sans-serif',
        ],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'Monaco', '"Cascadia Code"', 'monospace'],
        num: ['"SF Pro Display"', '-apple-system', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.14em' }],
        display: ['2.75rem', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        hero: ['3.5rem', { lineHeight: '1', letterSpacing: '-0.035em' }],
      },
      borderRadius: {
        xl2: '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.06)',
        pop: '0 12px 48px rgba(0,0,0,0.16)',
        glow: '0 8px 40px rgba(10,132,255,0.35)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        pop: { '0%': { opacity: '0', transform: 'scale(0.96) translateY(6px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(100%)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(255,255,255,0.4)' }, '70%': { boxShadow: '0 0 0 12px rgba(255,255,255,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        risebar: { '0%': { transform: 'scaleY(0)' }, '100%': { transform: 'scaleY(1)' } },
        spinSlow: { '0%': { transform: 'rotate(0)' }, '100%': { transform: 'rotate(360deg)' } },
        confettiSpin: { '0%': { transform: 'rotate(0) translateY(0)' }, '100%': { transform: 'rotate(720deg) translateY(-8px)' } },
      },
      animation: {
        pop: 'pop 0.32s cubic-bezier(0.22,1,0.36,1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.22,1,0.36,1)',
        'fade-in': 'fadeIn 0.4s ease',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.22,1,0.36,1) infinite',
        float: 'float 4s ease-in-out infinite',
        'spin-slow': 'spinSlow 12s linear infinite',
      },
    },
  },
  plugins: [],
}
