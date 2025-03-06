/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000', // Black for brutalist design
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        madeira: {
          "primary": "#000000",
          "secondary": "#000000",
          "accent": "#000000",
          "neutral": "#000000",
          "base-100": "#FFFFFF",
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        },
      },
    ],
  },
}