import type { Config } from "tailwindcss";

const config: Config = {
  // Sin darkMode — el cuaderno siempre es claro
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["var(--font-playfair)", "Times New Roman", "serif"],
        lora:     ["var(--font-lora)", "Georgia", "serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",

        // ── Módulos — paleta apagada, terrosa ──
        gym: {
          DEFAULT: "#3D5C30",  // verde oliva oscuro
          muted:   "#E8EEE4",  // sage muy claro
          border:  "#B0C4A5",  // sage suave
        },
        work: {
          DEFAULT: "#1E4A5C",  // azul petróleo
          muted:   "#DDE8ED",  // celeste muy claro
          border:  "#9BBAC8",  // petróleo suave
        },
        faculty: {
          DEFAULT: "#6B3D1E",  // siena / cuero rojizo
          muted:   "#F0E6DC",  // salmón muy claro
          border:  "#C8A893",  // siena suave
        },

        // ── Cuero para sidebar ──
        leather: {
          dark:   "#1C1008",
          mid:    "#2E1A0A",
          light:  "#4A2E12",
          text:   "#C4A87A",
          muted:  "#8A7258",
          active: "#E8D5A8",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "calc(var(--radius) - 2px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
