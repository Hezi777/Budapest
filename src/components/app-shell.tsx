"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Coins, Compass, Info, Map, Siren } from "lucide-react";
import { ToastProvider } from "./ui";
import { Welcome } from "./welcome";
import { updateSettings, useSettings, type TextSize } from "@/lib/store";

const NAV = [
  { href: "/", label: "התוכנית", Icon: CalendarDays },
  { href: "/map", label: "מפה", Icon: Map },
  { href: "/explore", label: "מקומות", Icon: Compass },
  { href: "/money", label: "כסף", Icon: Coins },
  { href: "/info", label: "מידע", Icon: Info },
];

const NEXT_SIZE: Record<TextSize, TextSize> = {
  normal: "large",
  large: "xlarge",
  xlarge: "normal",
};

const navIndex = (pathname: string) =>
  NAV.findIndex(({ href }) => (href === "/" ? pathname === "/" : pathname.startsWith(href)));

/** Where a swipe can't change tabs: the map, sideways scrollers, sheets and fields. */
function blocksSwipe(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true;
  if (target.closest(".leaflet-container, .sheet-backdrop, input, textarea, select, [data-no-swipe]")) return true;
  for (let el: Element | null = target; el && el !== document.body; el = el.parentElement) {
    const { overflowX } = getComputedStyle(el);
    if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth) return true;
  }
  return false;
}

/**
 * Swipe sideways to move between the bottom-nav tabs. In RTL the next tab sits
 * to the left, so it comes in from the left: a swipe to the right.
 */
function useTabSwipe(pathname: string) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const [slide, setSlide] = useState<{ to: string; from: "left" | "right" } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    start.current =
      e.touches.length === 1 && navIndex(pathname) >= 0 && !blocksSwipe(e.target)
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
        : null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - s.x;
    const dy = touch.clientY - s.y;
    // A deliberate, mostly-horizontal flick; scrolling up and down never counts.
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - s.t > 700) return;
    const next = navIndex(pathname) + (dx > 0 ? 1 : -1);
    if (next < 0 || next >= NAV.length) return;
    const to = NAV[next].href;
    // The new tab follows the finger in (a physical direction, like the gesture).
    setSlide({ to, from: dx > 0 ? "left" : "right" });
    router.push(to);
  }

  const className = slide && slide.to === pathname ? ` slide-from-${slide.from}` : "";
  return { onTouchStart, onTouchEnd, onAnimationEnd: () => setSlide(null), className };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { textSize } = useSettings();
  const swipe = useTabSwipe(pathname);

  useEffect(() => {
    document.documentElement.dataset.text = textSize;
  }, [textSize]);

  // Offline support once the app is on the home screen (production only).
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

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
      <main
        className={`app-main${swipe.className}`}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
        onAnimationEnd={(e) => e.target === e.currentTarget && swipe.onAnimationEnd()}
      >
        {children}
      </main>
      <nav className="bottom-nav" aria-label="ניווט ראשי">
        {NAV.map(({ href, label, Icon }, i) => {
          const active = i === navIndex(pathname);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}>
              <Icon size={22} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <Welcome />
    </ToastProvider>
  );
}
