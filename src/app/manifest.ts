import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "בודפשט · 26–29 בנובמבר",
    short_name: "בודפשט",
    description: "התוכנית לטיול בבודפשט",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "he",
    dir: "rtl",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the home-screen icon (Android) to jump straight in.
    shortcuts: [
      { name: "התוכנית", url: "/" },
      { name: "מפה", url: "/map" },
      { name: "המרת כסף", url: "/money" },
    ],
  };
}
