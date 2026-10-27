"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { CalendarDays, Coins, Compass, Info, Map, Siren } from "lucide-react";
import { ToastProvider } from "./ui";
import { updateSettings, useSettings, type TextSize } from "@/lib/store";

const NAV = [
  { href: "/", label: "התוכנית", Icon: CalendarDays },
  { href: "/map", label: "מפה", Icon: Map },
  { href: "/explore", label: "רעיונות", Icon: Compass },
  { href: "/money", label: "כסף", Icon: Coins },
  { href: "/info", label: "מידע", Icon: Info },
];

const NEXT_SIZE: Record<TextSize, TextSize> = {
  normal: "large",
  large: "xlarge",
  xlarge: "normal",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { textSize } = useSettings();

  useEffect(() => {
    document.documentElement.dataset.text = textSize;
  }, [textSize]);

  return (
    <ToastProvider>
      <header className="app-header">
        <Link href="/" className="app-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={34} height={34} />
          בודפשט
        </Link>
        <button
          type="button"
          className="header-pill"
          onClick={() => updateSettings({ textSize: NEXT_SIZE[textSize] })}
          aria-label="הגדלת הטקסט"
        >
          <span aria-hidden style={{ fontSize: "0.8em" }}>א</span>
          <span aria-hidden style={{ fontSize: "1.25em", marginInlineStart: -2 }}>א</span>
        </button>
        <Link href="/info#sos" className="header-pill is-sos">
          <Siren size={17} aria-hidden /> חירום
        </Link>
      </header>
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="ניווט ראשי">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}>
              <Icon size={22} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </ToastProvider>
  );
}
