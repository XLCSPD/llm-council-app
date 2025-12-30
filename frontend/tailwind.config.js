/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="light"]'],
  theme: {
    extend: {
      colors: {
        // Background colors using CSS variables
        'bg-base': 'var(--color-bg-base)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-elevated': 'var(--color-bg-elevated)',
        // Glass effect colors
        'glass-bg': 'var(--color-glass-bg)',
        'glass-border': 'var(--color-glass-border)',
        // Text colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        // Border colors
        'border': 'var(--color-border)',
        'border-focus': 'var(--color-border-focus)',
        // Brand accent colors (EveryDAI)
        'accent': 'var(--color-accent-primary)',
        'accent-secondary': 'var(--color-accent-secondary)',
        'accent-success': 'var(--color-accent-success)',
        'accent-warning': 'var(--color-accent-warning)',
        'accent-error': 'var(--color-accent-error)',
        // Role colors
        'role-thinker': 'var(--color-role-thinker)',
        'role-critic': 'var(--color-role-critic)',
        'role-devils-advocate': 'var(--color-role-devils-advocate)',
        'role-synthesizer': 'var(--color-role-synthesizer)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      backdropBlur: {
        'glass': '12px',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glow-teal': 'var(--glow-teal)',
        'glow-cyan': 'var(--glow-cyan)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'particle': 'particle 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(13, 148, 136, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(94, 234, 212, 0.5)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        particle: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
