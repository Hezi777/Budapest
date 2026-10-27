"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BedDouble,
  Bath,
  Check,
  Coffee,
  Copy,
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
}: {
  place: Place;
  className?: string;
  width?: 500 | 960;
  iconSize?: number;
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

  return (
    <div className={`photo ${className ?? ""}`}>
      <span className="photo-fallback">
        <CategoryIcon category={place.category} size={iconSize} />
      </span>
      {src && !broken && (
        <Image
          ref={checkLoaded}
          src={src}
          alt={place.local}
          fill
          unoptimized
          sizes={width === 960 ? "100vw" : "120px"}
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={panel}
        className="sheet"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="סגירה">
            <X size={22} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
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
