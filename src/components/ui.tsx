"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  BedDouble,
  Bath,
  Check,
  Coffee,
  Copy,
  Download,
  Landmark,
  Plane,
  ShoppingBag,
  Sparkles,
  TreePine,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { TAG_LABELS } from "@/lib/catalog";
import { photoUrl } from "@/lib/geo";
import type { Category, Place, Tag } from "@/lib/types";

/* ---------- Icons ---------- */

function StarOfDavid({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2.5 20.5 17h-17z" />
      <path d="M12 21.5 3.5 7h17z" />
    </svg>
  );
}

export function CategoryIcon({ category, size = 24 }: { category: Category; size?: number }) {
  switch (category) {
    case "food":
      return <UtensilsCrossed size={size} aria-hidden />;
    case "cafe":
      return <Coffee size={size} aria-hidden />;
    case "market":
      return <TreePine size={size} aria-hidden />;
    case "shopping":
      return <ShoppingBag size={size} aria-hidden />;
    case "bath":
      return <Bath size={size} aria-hidden />;
    case "jewish":
      return <StarOfDavid size={size} />;
    case "experience":
      return <Sparkles size={size} aria-hidden />;
    case "hotel":
      return <BedDouble size={size} aria-hidden />;
    case "transport":
      return <Plane size={size} aria-hidden />;
    default:
      return <Landmark size={size} aria-hidden />;
  }
}

/* ---------- Photo ---------- */

/**
 * A real photo pulled live through /api/photo, with a calm icon tile when
 * there is none — the same fallback the printed guide used.
 */
export function Photo({
  place,
  className,
  width = 500,
  iconSize = 32,
  hideIfMissing = false,
  decorative = false,
}: {
  place: Place;
  className?: string;
  width?: 500 | 960 | 1280;
  iconSize?: number;
  /** Render nothing, rather than an icon tile, when there's no photo. */
  hideIfMissing?: boolean;
  /** The name is printed next to the photo, so screen readers skip the picture (alt=""). */
  decorative?: boolean;
}) {
  const src = photoUrl(place, width);
  const [failed, setFailed] = useState<string | null>(null);
  const broken = failed === src;

  // An image that failed before hydration never fires onError, so check it.
  const checkLoaded = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && img.complete && img.naturalWidth === 0 && src) setFailed(src);
    },
    [src],
  );

  if (hideIfMissing && (!src || broken)) return null;

  return (
    <div className={`photo cat-${place.category} ${className ?? ""}`}>
      {iconSize > 0 && <CategoryIcon category={place.category} size={iconSize} />}
      {src && !broken && (
        <Image
          ref={checkLoaded}
          src={src}
          alt={decorative ? "" : place.local}
          fill
          unoptimized
          sizes={width >= 960 ? "100vw" : "120px"}
          onError={() => setFailed(src)}
        />
      )}
    </div>
  );
}

/* ---------- Tags ---------- */

export function Tags({ tags }: { tags?: Tag[] }) {
  if (!tags?.length) return null;
  return (
    <div className="tags">
      {tags.map((tag) => (
        <span key={tag} className={`tag tag-${tag}`}>
          {TAG_LABELS[tag]}
        </span>
      ))}
    </div>
  );
}

/* ---------- Bottom sheet ---------- */

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; t: number } | null>(null);
  const [closing, setClosing] = useState(false);

  // Slide out, then unmount. Exit is quicker than the entrance.
  const close = useCallback(() => {
    const el = panel.current;
    if (!el || closing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return onClose();
    setClosing(true);
    el.style.transition = "transform 220ms var(--ease-out)";
    el.style.transform = "translateY(100%)";
    setTimeout(onClose, 220);
  }, [closing, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current || closing || (e.target as Element).closest("button")) return;
    drag.current = { y: e.clientY, t: Date.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (panel.current) panel.current.style.transition = "none";
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || !panel.current) return;
    const dy = e.clientY - drag.current.y;
    // Pulling up past the top meets growing resistance instead of a wall.
    panel.current.style.transform = `translateY(${dy > 0 ? dy : -Math.sqrt(-dy) * 2}px)`;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    const el = panel.current;
    drag.current = null;
    if (!start || !el) return;
    const dy = e.clientY - start.y;
    const velocity = dy / Math.max(1, Date.now() - start.t);
    // A quick flick closes it, no matter how short.
    if (dy > el.offsetHeight * 0.25 || (dy > 10 && velocity > 0.11)) return close();
    el.style.transition = "transform 320ms var(--ease-drawer)";
    el.style.transform = "";
  }

  // Portaled to <body> so no page's stacking context (the map, its card) can
  // paint over it. Sheets only open after a tap, so document always exists.
  return createPortal(
    <div className={`sheet-backdrop${closing ? " is-closing" : ""}`} onClick={close}>
      <div
        ref={panel}
        className="sheet"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sheet-grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="sheet-handle" />
          <div className="sheet-head">
            <h2 className="sheet-title">{title}</h2>
            <button type="button" className="icon-btn" onClick={close} aria-label="סגירה">
              <X size={22} />
            </button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Toast ---------- */

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* ---------- Copy address (for Bolt) ---------- */

export function CopyAddress({ address, label = "יעד ל־Bolt" }: { address: string; label?: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast("הכתובת הועתקה. להדביק ב־Bolt");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(address);
    }
  }

  return (
    <button type="button" className="copy-address" onClick={copy}>
      <span>
        <span className="small">{label}: </span>
        <span className="addr latin">{address}</span>
      </span>
      {copied ? <Check size={20} aria-label="הועתק" /> : <Copy size={20} aria-label="העתקה" />}
    </button>
  );
}

/* ---------- App store links ---------- */

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  // iPadOS asks for the desktop site, so it says "Macintosh" but has touch.
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "other";
}

const noSubscribe = () => () => {};

/** The phone's platform on the client, "other" during server render. */
export function usePlatform(): Platform {
  return useSyncExternalStore(noSubscribe, detectPlatform, () => "other");
}

export type StoreIds = { app: string; ios: string; android: string };

export const STORE_URL = {
  ios: (id: string) => `https://apps.apple.com/app/id${id}`,
  android: (id: string) => `https://play.google.com/store/apps/details?id=${id}`,
};

/** Straight to this phone's app store; both stores when we can't tell. */
export function StoreLinks({ app, ios, android }: StoreIds) {
  const platform = usePlatform();
  if (platform === "other") {
    return (
      <div className="btn-row">
        <a className="btn btn-primary" href={STORE_URL.ios(ios)} target="_blank" rel="noreferrer">
          {app} לאייפון
        </a>
        <a className="btn btn-primary" href={STORE_URL.android(android)} target="_blank" rel="noreferrer">
          {app} לאנדרואיד
        </a>
      </div>
    );
  }
  const href = platform === "ios" ? STORE_URL.ios(ios) : STORE_URL.android(android);
  return (
    <a className="btn btn-primary" href={href} target="_blank" rel="noreferrer">
      <Download size={18} aria-hidden /> להורדת {app} מה־{platform === "ios" ? "App Store" : "Google Play"}
    </a>
  );
}

/* ---------- Illustrated Budapest ---------- */

/**
 * Parliament on the Danube at dusk, drawn so the home screen looks right even
 * before (or without) a photo.
 */
export function BudapestScene({ className }: { className?: string }) {
  const stars = [
    [40, 30], [92, 58], [150, 22], [210, 44], [262, 18], [318, 52], [362, 26],
    [70, 96], [300, 90], [180, 76], [24, 70], [380, 84],
  ];
  return (
    <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1530" />
          <stop offset="0.55" stopColor="#2a2f63" />
          <stop offset="1" stopColor="#8b5a7a" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2548" />
          <stop offset="1" stopColor="#0b1126" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd98a" />
          <stop offset="1" stopColor="#d9963a" />
        </linearGradient>
        <g id="parliament" fill="url(#gold)">
          {/* central dome and spire */}
          <rect x="196" y="96" width="8" height="18" />
          <path d="M200 70 l3 26 h-6z" />
          <path d="M176 150 c0-26 10-40 24-44 c14 4 24 18 24 44z" />
          <rect x="172" y="148" width="56" height="16" />
          {/* side towers */}
          <path d="M150 164 v-34 l5-14 5 14 v34z" />
          <path d="M240 164 v-34 l5-14 5 14 v34z" />
          {/* wings */}
          <rect x="60" y="164" width="280" height="40" />
          <rect x="84" y="150" width="70" height="14" />
          <rect x="246" y="150" width="70" height="14" />
          {[70, 96, 122, 278, 304, 330].map((x) => (
            <path key={x} d={`M${x} 150 v-14 l4-10 4 10 v14z`} />
          ))}
          <rect x="44" y="176" width="16" height="28" />
          <rect x="340" y="176" width="16" height="28" />
        </g>
      </defs>
      <rect width="400" height="300" fill="url(#sky)" />
      <circle cx="322" cy="62" r="16" fill="#fbe6b0" opacity="0.9" />
      <circle cx="329" cy="57" r="14" fill="#2a2f63" opacity="0.55" />
      {stars.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#fff" opacity="0.75" />
      ))}
      {/* Buda hills behind */}
      <path d="M0 176 C60 150 110 160 160 168 S280 150 400 166 V210 H0z" fill="#1d2149" />
      <use href="#parliament" />
      {/* windows */}
      <g fill="#2a1f10" opacity="0.55">
        {Array.from({ length: 22 }, (_, i) => (
          <rect key={i} x={68 + i * 12.4} y="180" width="4" height="14" rx="2" />
        ))}
      </g>
      <rect y="204" width="400" height="96" fill="url(#water)" />
      <use href="#parliament" transform="matrix(1 0 0 -0.6 0 326)" opacity="0.28" />
      <g stroke="#ffd98a" strokeLinecap="round" opacity="0.5">
        <path d="M120 222 h40 M220 230 h56 M90 244 h30 M180 252 h70 M250 266 h40 M140 274 h50" strokeWidth="2" />
      </g>
    </svg>
  );
}
