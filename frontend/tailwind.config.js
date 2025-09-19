module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tube-red': '#E32017',
        'tube-blue': '#003688',
        'tube-green': '#00782A',
        'tube-yellow': '#FFD700',
        'tube-purple': '#9B0056',
        'tube-pink': '#F3A9BB',
        'tube-orange': '#FF8C00',
        'tube-brown': '#8B4513',
        'tube-grey': '#A0A5A9',
        'tube-black': '#000000',
      },
    },
  },
  plugins: [],
}