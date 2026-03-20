/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './App.tsx'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        foreground: '#fafafa',
        primary: {
          DEFAULT: '#EFBF04',
          foreground: '#0a0a0a',
        },
        accent: '#EFBF04',
        secondary: {
          DEFAULT: '#1e1e1e',
          foreground: '#fafafa',
        },
        muted: {
          DEFAULT: '#1e1e1e',
          foreground: '#a0a0a0',
        },
        border: 'rgba(212, 175, 55, 0.15)',
        gold: {
          vivid: '#EFBF04',
          medium: '#D4A804',
          pale: '#F5D54A',
          dark: '#B8920A',
          bg: '#FDF2CC',
        },
        // flat aliases for convenience
        'gold-vivid': '#EFBF04',
        'gold-medium': '#D4A804',
        'gold-pale': '#F5D54A',
        'gold-dark': '#B8920A',
        'gold-bg': '#FDF2CC',
        recovery: {
          recovering: '#C49600',
          almost: '#8B9A3F',
          ready: '#5C8A5C',
        },
        recovering: '#C49600',
        almost: '#8B9A3F',
        ready: '#5C8A5C',
      },
      fontFamily: {
        heading: ['Quilon-Medium', 'system-ui'],
        body: ['Rowan-Regular', 'system-ui'],
      },
      fontSize: {
        'display-lg': ['39.06px', { lineHeight: '1.55', letterSpacing: '0.015em', fontWeight: '800' }],
        'display-md': ['34.94px', { lineHeight: '1.55', letterSpacing: '0.015em', fontWeight: '800' }],
        h1: ['31.25px', { lineHeight: '1.55', letterSpacing: '0.02em', fontWeight: '700' }],
        h2: ['25px', { lineHeight: '1.55', letterSpacing: '0.02em', fontWeight: '600' }],
        h3: ['22.36px', { lineHeight: '1.60', letterSpacing: '0.025em', fontWeight: '600' }],
        h4: ['20px', { lineHeight: '1.60', letterSpacing: '0.025em', fontWeight: '500' }],
        h5: ['18.91px', { lineHeight: '1.60', letterSpacing: '0.03em', fontWeight: '500' }],
        h6: ['17.89px', { lineHeight: '1.60', letterSpacing: '0.03em', fontWeight: '500' }],
        'body-xl': ['16.92px', { lineHeight: '1.60', letterSpacing: '0.03em' }],
        body: ['16px', { lineHeight: '1.60', letterSpacing: '0.03em' }],
        'body-sm': ['15.13px', { lineHeight: '1.65', letterSpacing: '0.03em' }],
        'caption-lg': ['14.31px', { lineHeight: '1.65', letterSpacing: '0.03em' }],
        caption: ['13.53px', { lineHeight: '1.65', letterSpacing: '0.03em' }],
        'caption-sm': ['12.80px', { lineHeight: '1.65', letterSpacing: '0.03em', fontWeight: '300' }],
        overline: ['12.11px', { lineHeight: '1.65', letterSpacing: '0.03em', fontWeight: '500' }],
      },
      boxShadow: {
        glow: '0 0 20px rgba(212, 175, 55, 0.3)',
        'glow-lg': '0 0 40px rgba(212, 175, 55, 0.4)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        lg: 10,
        xl: 12,
        '2xl': 16,
        '3xl': 24,
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.card-primary': {
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 16,
        },
        '.card-secondary': {
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 12,
        },
        '.btn-primary': {
          backgroundColor: '#EFBF04',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
        },
        '.btn-secondary': {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
        },
      });
    },
  ],
};
