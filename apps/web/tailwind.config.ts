import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment:      '#fcfaf1',
        bone:           '#efe9e0',
        loam:           '#c7bcaf',
        bark:           '#96897b',
        saddle:         '#50463c',
        ink:            '#211b15',
        'charcoal-olive': '#252a23',
        'deep-olive':   '#434f40',
        sage:           '#7a9779',
        amber:          '#e8b672',
        wheat:          '#f0c891',
        // Semantic
        success:        '#2d7a4f',
        warning:        '#c47a1e',
        danger:         '#b91c1c',
        info:           '#1a5f8a',
        'success-bg':   '#edf7f1',
        'warning-bg':   '#fdf3e3',
        'danger-bg':    '#fdecea',
        'info-bg':      '#e8f2f9',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Source Serif 4', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'caption':    ['11px', { lineHeight: '1.5',  letterSpacing: '0.107em' }],
        'eyebrow':    ['13px', { lineHeight: '1.6',  letterSpacing: '0.058em' }],
        'body':       ['15px', { lineHeight: '1.71' }],
        'body-lg':    ['17px', { lineHeight: '1.6'  }],
        'subheading': ['19px', { lineHeight: '1.43', letterSpacing: '-0.011em' }],
        'heading-sm': ['30px', { lineHeight: '1.33', letterSpacing: '-0.011em' }],
        'heading':    ['38px', { lineHeight: '1.14', letterSpacing: '-0.011em' }],
        'heading-lg': ['53px', { lineHeight: '1.1',  letterSpacing: '-0.011em' }],
        'display':    ['clamp(42px,6vw,68px)', { lineHeight: '1', letterSpacing: '-0.011em' }],
      },
      borderRadius: {
        'sm':   '3.75px',
        'md':   '7.5px',
        'lg':   '12px',
        'pill': '9999px',
      },
      spacing: {
        '18': '72px',
        '22': '88px',
        '30': '120px',
      },
      screens: {
        'xs':  '360px',
        'sm':  '480px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1536px',
      },
      maxWidth: {
        'page':    '1200px',
        'content': '700px',
      },
      keyframes: {
        'skeleton-wave': {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(12px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(232,182,114,0.5)' },
          '70%':  { boxShadow: '0 0 0 12px rgba(232,182,114,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(232,182,114,0)' },
        },
      },
      animation: {
        'skeleton':   'skeleton-wave 1.5s ease-in-out infinite',
        'fade-in':    'fade-in 0.4s ease forwards',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
