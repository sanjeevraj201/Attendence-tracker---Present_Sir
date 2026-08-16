/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        primaryOrange: '#FF5E00', // Sunset Orange
        primaryOrangeDark: '#CC4A00',
        offWhite: '#F9FAFB',
        cardBorder: '#E5E5EA',
        cardDark: '#1C1C1E', // Apple's elevated dark card color
        oledBlack: '#000000',
        success: '#008000',
        warning: '#FF9500',
        danger: '#FF3B30',
      },
    },
  },
  plugins: [],
}
