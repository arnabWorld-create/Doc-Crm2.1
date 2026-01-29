/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-brand-teal',
    'bg-brand-yellow',
    'bg-brand-red',
    'text-brand-teal',
    'text-brand-yellow',
    'text-brand-red',
    'border-brand-teal',
    'border-brand-yellow',
    'border-brand-red',
    'hover:bg-brand-teal',
    'hover:bg-brand-yellow',
    'hover:bg-brand-red',
    'hover:text-brand-teal',
    'hover:text-brand-yellow',
    'hover:text-brand-red',
    'hover:border-brand-teal',
    'hover:border-brand-yellow',
    'hover:border-brand-red',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#007c74',
          yellow: '#F6D02F',
          red: '#ec1c23',
          blue: '#0ea5e9',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#007c74',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: '#ec1c23',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          red: '#ec1c23',
          yellow: '#F6D02F',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-hero': 'linear-gradient(135deg, #007c74 0%, #0ea5e9 100%)',
        'gradient-section': 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
