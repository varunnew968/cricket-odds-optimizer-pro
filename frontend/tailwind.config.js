/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // darker theme
        card: '#18181b', // light dark
        primary: '#3b82f6', // blue
        secondary: '#a855f7', // purple
        accent: '#22c55e', // green
        danger: '#ef4444', // red
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
