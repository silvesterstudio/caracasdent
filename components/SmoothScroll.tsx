"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/**
 * Lenis smooth scrolling — the same technique the reference site uses.
 * `root` mode eases the real window scroll (no wrapper transform), so
 * position: sticky keeps working. All hero animation reads window.scrollY,
 * which now reflects the eased position.
 */

// Division of labour between the two levers:
//   • wheelMultiplier 0.4 → 40% of the distance per gesture — this alone keeps the
//     scroll SLOW; it is the only "speed" control.
//   • lerp 0.09 → how fast the page converges on the target each frame. Dropping this
//     below ~0.07 makes the glide so gradual that per-frame movement falls under 1px
//     (scrollY is integer-quantised), which reads as stutter, and every gesture drags
//     a second-long floaty tail — the "not smooth" feel. Keep slowness in the
//     multiplier, smoothness in the lerp.
// The `LENIS_KEY` (derived from these values) is used as the component key so that any
// change here forces a full remount — otherwise React Fast Refresh keeps the OLD Lenis
// instance (and its old multiplier) alive until a hard page reload.
const LENIS_OPTIONS = { lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.4, touchMultiplier: 0.56 };
const LENIS_KEY = `lenis-${LENIS_OPTIONS.wheelMultiplier}-${LENIS_OPTIONS.lerp}`;

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis key={LENIS_KEY} root options={LENIS_OPTIONS}>
      {children}
    </ReactLenis>
  );
}
