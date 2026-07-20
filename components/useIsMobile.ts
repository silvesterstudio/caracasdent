"use client";

import { useEffect, useState } from "react";

/**
 * useIsMobile — true below the given breakpoint (default 860px). Starts false
 * (matching the SSR/desktop markup, so hydration never mismatches) and flips
 * in an effect; also tracks live resizes/rotations.
 */
export function useIsMobile(bp = 860) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [bp]);
  return mobile;
}
