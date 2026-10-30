"use client";

import { useEffect } from "react";

/**
 * Opens the <details> whose id matches the URL hash (e.g. /info#transport),
 * on load and whenever the hash changes, then scrolls it into view. Renders
 * nothing; the details stay plain, server-rendered HTML.
 */
export function HashOpen() {
  useEffect(() => {
    function openFromHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);
  return null;
}
