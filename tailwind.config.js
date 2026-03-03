/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#09090B',
          secondary: '#111115',
          card: '#18181B',
        },
        border: {
          primary: '#27272A',
        },
        text: {
          primary: '#FAFAFA',
          muted: '#71717A',
          very: '#52525B',
        },
        accent: {
          primary: '#8B5CF6',
          hover: '#7C3AED',
          spotify: '#1DB954',
          star: '#EAB308',
        },
      },
      fontFamily: {
        heading: ['Cormorant Garamond', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.3em',
      },
    },
  },
  plugins: [],
};
