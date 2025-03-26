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
    heroui(
    {
      "themes": {
        "light": {
          "colors": {
            "default": {
              "50": "#fbfaf9",
              "100": "#f4f3f1",
              "200": "#eeece9",
              "300": "#e8e4e0",
              "400": "#e1ddd8",
              "500": "#dbd6d0",
              "600": "#b5b1ac",
              "700": "#8e8b87",
              "800": "#686663",
              "900": "#42403e",
              "foreground": "#000",
              "DEFAULT": "#dbd6d0"
            },
            "primary": {
              "50": "#eeeaf0",
              "100": "#d5ccdb",
              "200": "#bdaec6",
              "300": "#a491b1",
              "400": "#8c739c",
              "500": "#735587",
              "600": "#5f466f",
              "700": "#4b3758",
              "800": "#372840",
              "900": "#231a29",
              "foreground": "#fff",
              "DEFAULT": "#735587"
            },
            "secondary": {
              "50": "#ebf7f7",
              "100": "#ceecec",
              "200": "#b1e1e0",
              "300": "#94d6d5",
              "400": "#78cbc9",
              "500": "#5bc0be",
              "600": "#4b9e9d",
              "700": "#3b7d7c",
              "800": "#2b5b5a",
              "900": "#1b3a39",
              "foreground": "#000",
              "DEFAULT": "#5bc0be"
            },
            "success": {
              "50": "#e1f6ef",
              "100": "#b7ead9",
              "200": "#8ddec3",
              "300": "#64d2ad",
              "400": "#3ac597",
              "500": "#10b981",
              "600": "#0d996a",
              "700": "#0a7854",
              "800": "#08583d",
              "900": "#053827",
              "foreground": "#000",
              "DEFAULT": "#10b981"
            },
            "warning": {
              "50": "#fff9eb",
              "100": "#fff2cf",
              "200": "#ffeab3",
              "300": "#ffe297",
              "400": "#ffda7b",
              "500": "#ffd25f",
              "600": "#d2ad4e",
              "700": "#a6893e",
              "800": "#79642d",
              "900": "#4d3f1d",
              "foreground": "#000",
              "DEFAULT": "#ffd25f"
            },
            "danger": {
              "50": "#fceded",
              "100": "#f7d3d4",
              "200": "#f3b9bb",
              "300": "#ee9fa1",
              "400": "#ea8588",
              "500": "#e56b6f",
              "600": "#bd585c",
              "700": "#954648",
              "800": "#6d3335",
              "900": "#452021",
              "foreground": "#000",
              "DEFAULT": "#e56b6f"
            },
            "background": "#faf8f7",
            "overlay": "#000000"
          }
        },
        "dark": {
          "colors": {
            "default": {
              "50": "#0d0b0d",
              "100": "#1a161a",
              "200": "#272227",
              "300": "#342d34",
              "400": "#413841",
              "500": "#676067",
              "600": "#8d888d",
              "700": "#b3afb3",
              "800": "#d9d7d9",
              "900": "#ffffff",
              "foreground": "#fff",
              "DEFAULT": "#413841"
            },
            "primary": {
              "50": "#231a29",
              "100": "#372840",
              "200": "#4b3758",
              "300": "#5f466f",
              "400": "#735587",
              "500": "#8c739c",
              "600": "#a491b1",
              "700": "#bdaec6",
              "800": "#d5ccdb",
              "900": "#eeeaf0",
              "foreground": "#fff",
              "DEFAULT": "#735587"
            },
            "secondary": {
              "50": "#1b3a39",
              "100": "#2b5b5a",
              "200": "#3b7d7c",
              "300": "#4b9e9d",
              "400": "#5bc0be",
              "500": "#78cbc9",
              "600": "#94d6d5",
              "700": "#b1e1e0",
              "800": "#ceecec",
              "900": "#ebf7f7",
              "foreground": "#000",
              "DEFAULT": "#5bc0be"
            },
            "success": {
              "50": "#053827",
              "100": "#08583d",
              "200": "#0a7854",
              "300": "#0d996a",
              "400": "#10b981",
              "500": "#3ac597",
              "600": "#64d2ad",
              "700": "#8ddec3",
              "800": "#b7ead9",
              "900": "#e1f6ef",
              "foreground": "#000",
              "DEFAULT": "#10b981"
            },
            "warning": {
              "50": "#4d3f1d",
              "100": "#79642d",
              "200": "#a6893e",
              "300": "#d2ad4e",
              "400": "#ffd25f",
              "500": "#ffda7b",
              "600": "#ffe297",
              "700": "#ffeab3",
              "800": "#fff2cf",
              "900": "#fff9eb",
              "foreground": "#000",
              "DEFAULT": "#ffd25f"
            },
            "danger": {
              "50": "#452021",
              "100": "#6d3335",
              "200": "#954648",
              "300": "#bd585c",
              "400": "#e56b6f",
              "500": "#ea8588",
              "600": "#ee9fa1",
              "700": "#f3b9bb",
              "800": "#f7d3d4",
              "900": "#fceded",
              "foreground": "#000",
              "DEFAULT": "#e56b6f"
            },
            "background": "#20161F",
            "overlay": "#ffffff"
          }
        }
      },
      "layout": {
        "disabledOpacity": "0.5"
      }
    }),
  ],
}
