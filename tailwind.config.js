/* eslint-disable no-undef */
const { heroui } = require("@heroui/react")

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50: '#e6e3ff',
              100: '#d5d1ff',
              200: '#b1abff',
              300: '#9086ff',
              400: '#7166ff',
              500: '#564af5',
              600: '#483ec9',
              700: '#393297',
              800: '#282464',
              900: '#161433',
              DEFAULT: '#564af5',
            },
            secondary: {
              50: '#ffdcef',
              100: '#ffc2e3',
              200: '#ff94cb',
              300: '#fb6ab2',
              400: '#ef469a',
              500: '#d23785',
              600: '#af2c6d',
              700: '#862254',
              800: '#5b193a',
              900: '#330f21',
              DEFAULT: '#EF469A',
            },
          },
        },
        dark: {
          colors: {
            primary: {
              50: '#1e1c42',
              100: '#262352',
              200: '#332c76',
              300: '#4839dc',
              400: '#5647e8',
              500: '#6557f0',
              600: '#7e73f5',
              700: '#aca6f9',
              800: '#d3d0fc',
              900: '#f5f5ff',
              DEFAULT: '#6557f0',
            },
            secondary: {
              50: '#511734',
              100: '#6e1d45',
              200: '#9f2964',
              300: '#cb3680',
              400: '#ef469a',
              500: '#fc64af',
              600: '#ff86c2',
              700: '#ffaad5',
              800: '#ffd1e8',
              900: '#fff5fa',
              DEFAULT: '#ef469a',
            },
          },
        },
      },
    }),
  ],
}
