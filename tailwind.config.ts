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
        turq: {
          DEFAULT: '#2ec4b6',
          deep:    '#1a9e92',
          soft:    '#e6f9f7',
          glow:    'rgba(46,196,182,0.14)',
        },
        gold: {
          DEFAULT: '#f5a623',
          soft:    '#fef8ec',
        },
        ink: {
          DEFAULT: '#0d2b28',
          2:       '#1e4a44',
        },
        muted: {
          DEFAULT: '#5a8a84',
          2:       '#8abfba',
        },
        offwhite: '#f7fafa',
      },
      fontFamily: {
        nunito:  ['Nunito', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        pill: '30px',
      },
      maxWidth: {
        content: '980px',
      },
    },
  },
  plugins: [],
}

export default config
