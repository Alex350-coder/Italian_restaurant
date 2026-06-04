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
        'rosso-pomodoro': '#C41E3A',
        'rosso-vivo': '#DC143C',
        'verde-basilico': '#228B22',
        'verde-salvia': '#6B8E23',
        'bianco-mozzarella': '#FFFDD0',
        'dorado-aceite': '#DAA520',
        'oro-puro': '#FFD700',
        'tierra-marron': '#8B4513',
        'noche-negro': '#1A1A2E',
        'crema': '#FAF0E6',
        dark: {
          bg: '#0F0F1A',
          surface: '#1A1A2E',
          card: '#1E1E32',
          border: '#2A2A3E',
          text: '#E0E0E0',
          muted: '#9CA3AF',
        },
        // High contrast colors for WCAG AA compliance
        'a11y': {
          'focus': '#DAA520',
          'error': '#D32F2F',
          'success': '#2E7D32',
          'warning': '#F57F17',
          'info': '#1565C0',
        },
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Lato', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 4px 14px 0 rgba(196, 30, 58, 0.15)',
        'olive': '0 4px 14px 0 rgba(34, 139, 34, 0.15)',
        'glow-gold': '0 0 20px rgba(218, 165, 32, 0.3)',
        'glow-gold-lg': '0 0 40px rgba(218, 165, 32, 0.4), 0 0 80px rgba(218, 165, 32, 0.15)',
        'glow-red': '0 0 20px rgba(196, 30, 58, 0.3)',
        'glow-red-lg': '0 0 40px rgba(196, 30, 58, 0.4), 0 0 80px rgba(196, 30, 58, 0.15)',
        'glow-green': '0 0 20px rgba(34, 139, 34, 0.3)',
        'focus': '0 0 0 3px rgba(218, 165, 32, 0.4)',
        'focus-error': '0 0 0 3px rgba(211, 47, 47, 0.4)',
        '3d': '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        '3d-lg': '0 16px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
        '3d-gold': '0 8px 32px rgba(218,165,32,0.2), 0 2px 8px rgba(0,0,0,0.06)',
        '3d-gold-lg': '0 16px 48px rgba(218,165,32,0.25), 0 4px 12px rgba(0,0,0,0.08)',
        '3d-red': '0 8px 32px rgba(196,30,58,0.2), 0 2px 8px rgba(0,0,0,0.06)',
        'button-3d': '0 6px 0 #B8860B, 0 8px 20px rgba(0,0,0,0.15)',
        'button-3d-active': '0 2px 0 #B8860B, 0 4px 12px rgba(0,0,0,0.15)',
        'button-glow': '0 4px 16px rgba(218,165,32,0.35)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'italian-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23daa520' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-down': 'slideDown 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'bounce': 'bounce 1s infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'skeleton-pulse': 'skeletonPulse 1.5s ease-in-out infinite',
        'ripple': 'ripple 0.6s linear forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        skeletonPulse: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        ripple: {
          from: { transform: 'scale(0)', opacity: '1' },
          to: { transform: 'scale(4)', opacity: '0' },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      ringWidth: {
        '3': '3px',
        '5': '5px',
      },
      ringOffsetWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
