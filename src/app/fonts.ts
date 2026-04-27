import localFont from "next/font/local";

export const helveticaNowDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/Helvetica Now Display Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Helvetica Now Display.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Helvetica Now Display Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-helvetica-now-display",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});
