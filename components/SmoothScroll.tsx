"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/**
 * Lenis smooth scrolling — the same technique the reference site uses.
 * `root` mode eases the real window scroll (no wrapper transform), so
 * position: sticky keeps working. All hero animation reads window.scrollY,
 * which now reflects the eased position.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 }}
    >
      {children}
    </ReactLenis>
  );
}
