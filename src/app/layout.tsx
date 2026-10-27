import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const assistant = localFont({
  src: "./fonts/Assistant.ttf",
  variable: "--font-assistant",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "בודפשט · 26–29 בנובמבר",
  description: "התוכנית לטיול בבודפשט: ימים, מפה, אוכל כשר, המרת מטבע וטיפים.",
  appleWebApp: { capable: true, title: "בודפשט", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f4f1ec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" data-text="normal" className={assistant.variable}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
