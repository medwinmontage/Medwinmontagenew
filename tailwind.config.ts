import type { Config } from 'tailwindcss';

// Colours are read from the design tokens in src/app/globals.css, so a theme
// change is a token change there — nothing here needs to be touched.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-hi': 'var(--accent-hi)',
        'accent-soft': 'var(--accent-soft)',
        'accent-ink': 'var(--accent-ink)',
        'on-accent': 'var(--on-accent)',
        ink: 'rgb(var(--text-rgb) / <alpha-value>)',
        'ink-2': 'var(--text-2)',
        muted: 'var(--muted)',
        paper: 'rgb(var(--bg-rgb) / <alpha-value>)',
        'paper-2': 'var(--bg-2)',
        card: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'card-2': 'var(--surface-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
        'glow-sm': 'var(--glow-sm)',
        'glow-md': 'var(--glow-md)',
        'glow-lg': 'var(--glow-lg)',
      },
    },
  },
  plugins: [],
};
export default config;
