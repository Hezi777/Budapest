"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { CalendarDays, Coins, Compass, Lightbulb, Map } from "lucide-react";
import { ToastProvider } from "./ui";
import { updateSettings, useSettings, type TextSize } from "@/lib/store";

const NAV = [
  { href: "/", label: "התוכנית", Icon: CalendarDays },
  { href: "/map", label: "מפה", Icon: Map },
  { href: "/explore", label: "רעיונות", Icon: Compass },
  { href: "/money", label: "כסף", Icon: Coins },
  { href: "/tips", label: "טיפים", Icon: Lightbulb },
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
          <span className="app-brand-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" width={36} height={36} />
          </span>
          בודפשט
        </Link>
        <button
          type="button"
          className="text-size-button"
          onClick={() => updateSettings({ textSize: NEXT_SIZE[textSize] })}
          aria-label="שינוי גודל הטקסט"
        >
          <span aria-hidden style={{ fontSize: "0.8em" }}>א</span>
          <span aria-hidden style={{ fontSize: "1.2em" }}>א</span>
          גודל טקסט
        </button>
      </header>
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="ניווט ראשי">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}>
              <span className="nav-icon">
                <Icon size={22} aria-hidden />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </ToastProvider>
  );
}
