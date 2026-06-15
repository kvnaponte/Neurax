import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        'cinzel-decorative': ['Cinzel Decorative', 'serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        neurax: {
          bg: '#07061a',
          surface: '#14152e',
          border: 'rgba(168,132,251,0.15)',
          gold: '#fbbf24',
          purple: '#7c3aed',
          'purple-soft': '#a855f7',
        },
      },
    },
  },
  plugins: [],
}

export default config
