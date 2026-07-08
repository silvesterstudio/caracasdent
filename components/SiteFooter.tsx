"use client";

import { useEffect, useRef } from "react";

/**
 * SiteFooter — a full-bleed PREFOOTER image, with the FOOTER rising up OVER it
 * (not the default flow). The footer's top edge starts as a big convex curve (a
 * circle/dome) and flattens to a normal flat footer as it settles into place.
 */

const FOOT_BG = "#17171c";
const LIGHT = "#f1f1f3";
const FONT = "var(--font-nunito), 'Nunito', system-ui, sans-serif";

type FooterCopy = {
  heading: string;
  chooseLocation: string;
  locations: [string, string, string];
  name: string;
  phone: string;
  message: string;
};

export default function SiteFooter({ footer, book, serif }: { footer: FooterCopy; book: string; serif: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
    let total = 0;
    let rootTop = 0;
    const measure = () => {
      const r = rootRef.current;
      if (!r) return;
      rootTop = r.offsetTop;
      total = r.offsetHeight - window.innerHeight;
    };
    const update = () => {
      const el = footRef.current;
      if (!el) return;
      const p = total > 0 ? cl((window.scrollY - rootTop) / total) : 0;
      const rise = cl(p / 0.82); // footer rises over the image, settled by p=0.82
      const curve = (1 - rise) * 190; // big dome while rising → flat when settled
      el.style.transform = "translateY(" + ((1 - rise) * 100).toFixed(2) + "%)";
      el.style.borderTopLeftRadius = "50% " + curve.toFixed(1) + "px";
      el.style.borderTopRightRadius = "50% " + curve.toFixed(1) + "px";
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    const onResize = () => {
      measure();
      update();
    };
    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    const t = setTimeout(() => {
      measure();
      update();
    }, 200);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  const inputStyle: React.CSSProperties = {
    appearance: "none",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "999px",
    padding: "18px 26px",
    fontFamily: FONT,
    fontSize: "15px",
    color: LIGHT,
    outline: "none",
    width: "100%",
  };

  return (
    <div ref={rootRef} style={{ position: "relative", height: "180vh", marginTop: "-80vh", zIndex: 5 }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: "transparent", pointerEvents: "none" }}>
        {/* ── FOOTER panel rises OVER the previous (Ce oferim) section, curved top
             flattening. No prefooter image — the sticky area is transparent. ── */}
        <div
          ref={footRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background: FOOT_BG,
            transform: "translateY(100%)",
            borderTopLeftRadius: "50% 190px",
            borderTopRightRadius: "50% 190px",
            willChange: "transform, border-radius",
            pointerEvents: "auto",
            padding: "clamp(40px,7vh,90px) 5% clamp(30px,5vh,60px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* logo (smile) centered — larger, with a big gap to the content below */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "clamp(70px,14vh,170px)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- brand logo SVG */}
            <img src="/caracas-logo.svg" alt="Caracaș Dental" style={{ height: "clamp(70px,7.5vw,104px)", width: "auto", filter: "brightness(0) invert(1)", opacity: 0.95 }} />
          </div>

          {/* heading + form (no socials, no location picker) */}
          <div style={{ maxWidth: "820px", margin: "0 auto", width: "100%" }}>
            <h2
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: "clamp(32px,3.8vw,66px)",
                lineHeight: 1.06,
                letterSpacing: "-0.015em",
                color: LIGHT,
                margin: "0 0 clamp(32px,5vh,56px)",
                maxWidth: "20ch",
              }}
            >
              {footer.heading}
            </h2>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
              <input style={{ ...inputStyle, flex: "1 1 240px" }} placeholder={footer.name} />
              <input style={{ ...inputStyle, flex: "1 1 240px" }} placeholder={footer.phone} />
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "stretch" }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder={footer.message} />
              <button
                aria-label={book}
                style={{
                  appearance: "none",
                  border: 0,
                  cursor: "pointer",
                  flex: "none",
                  width: "58px",
                  height: "58px",
                  borderRadius: "999px",
                  background: LIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h9M8.5 4l4 4-4 4" stroke="#17171c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
