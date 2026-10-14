import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#3b82f6',
        'accent-dark': '#1e40af',
        'bg-light': '#f9fafb',
        'border-light': '#e5e7eb',
      },
    },
  },
  plugins: [],
}
export default config
