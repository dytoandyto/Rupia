import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fintech Premium Design System Tokens
        "primary": "#176B4D",
        "primary-dark": "#104A37",
        "primary-light": "#E5F3EB",
        "primary-container": "#176B4D",
        "on-primary": "#ffffff",
        "on-primary-container": "#E5F3EB",
        "primary-fixed": "#E5F3EB",
        "primary-fixed-dim": "#C3E5D4",

        "app-bg": "#F6F7F4",
        "surface": "#F6F7F4",
        "surface-card": "#FFFFFF",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F0F3EF",
        "surface-container": "#E8ECE6",
        "surface-container-high": "#E2E7DF",
        "surface-container-highest": "#D9DFD6",
        "surface-dim": "#E5E9E3",
        "surface-variant": "#E5E9E3",
        "surface-bright": "#FAFBF9",

        "on-surface": "#202722",
        "on-surface-variant": "#707970",
        "text-primary": "#202722",
        "text-secondary": "#707970",
        "text-tertiary": "#8E988E",
        "border-subtle": "#E5E9E3",
        "outline": "#8E988E",
        "outline-variant": "#E5E9E3",

        "positive": "#18794E",
        "negative": "#C44747",
        "attention": "#A86B18",
        "error": "#C44747",
        "error-container": "#FDE8E8",

        "inverse-surface": "#16251E",
        "inverse-on-surface": "#F0F4F1",
        "card-dark": "#16251E",

        "secondary": "#526056",
        "secondary-container": "#E5ECE6",
        "on-secondary-container": "#3F4B42",

        "tertiary": "#A86B18",
        "tertiary-container": "#FDF2E2",
        "tertiary-fixed": "#FDF2E2",
        "tertiary-fixed-dim": "#F7D8A7",

        // Rupia custom tokens
        rupia: {
          bg: '#F6F7F4',
          surface: '#FFFFFF',
          'surface-dim': '#F0F3EF',
          'surface-container-low': '#F0F3EF',
          ink: '#202722',
          muted: '#707970',
          border: '#E5E9E3',
          primary: '#176B4D',
          'primary-hover': '#104A37',
          'primary-soft': '#E5F3EB',
          'dark-card': '#16251E',
          'dark-card-border': '#203429',
          positive: '#18794E',
          warning: '#A86B18',
          negative: '#C44747',
          50: '#F0F7F4',
          100: '#E5F3EB',
          200: '#C3E5D4',
          300: '#94D0B4',
          400: '#52B38A',
          500: '#176B4D',
          600: '#135940',
          700: '#104A37',
          800: '#0C382A',
          900: '#092B20',
          950: '#041711',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      spacing: {
        "margin": "1.25rem",
        "gutter": "1rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};
export default config;
