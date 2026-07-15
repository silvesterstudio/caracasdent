"use client";

import { useEffect, useRef } from "react";
import ImageSlot from "./ImageSlot";

/**
 * ConsultationTimeline — the "how it works" path that lands the user on the free
 * consultation CTA, styled as a vertical timeline (mosaicist "Our Process"
 * pattern) adapted to the Caracaș light brand.
 *
 * A single coral line runs down the centre of the section. As you scroll, a
 * coral FILL grows from the top down to your scroll position and a small disc
 * rides along its leading edge — so the line reads as real progress along the
 * path, not decoration. Each step is a landscape photo the line passes through,
 * with the coral serif step name on the left and the body copy on the right;
 * the path ends on a single node and the booking CTA.
 */

const BG = "#ffffff";
const INK = "#1c2b30";
const ACCENT = "#fe7183";
const FONT = "var(--sans)";
const IMG_BG = "#dbe3e3";

// Wide, on-brand clinic photography (Unsplash CDN) — one per step, in order.
// These IDs are the verified-live ones already used elsewhere on the site, here
// cropped landscape. Swap for the clinic's own photos later; layout is identical.
const U = (id: string, w: number, h: number, faces = false) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}&h=${h}${faces ? "&crop=faces" : ""}`;
const STEP_IMAGES = [
  U("1588776813941-dcf9c55e84d2", 1400, 900), // Programare — clinic
  U("1662837775286-7e6258c7c595", 1400, 900), // Consultație — chairside exam
  U("1489278353717-f64c6ee8a4d2", 1400, 900, true), // Plan — bright finished smile
];

export default function ConsultationTimeline({
  eyebrow,
  title,
  label,
  steps,
  cta,
  serif,
}: {
  eyebrow: string;
  title: string;
  label: string;
  steps: { name: string; desc: string }[];
  cta: string;
  serif: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
    let start = 0;
    let span = 1;
    const measure = () => {
      const t = trackRef.current;
      if (!t) return;
      // Progress is tied to the TRACK's own travel through the viewport centre,
      // so the fill/scrubber line up with the actual station photos regardless
      // of the header height above them.
      const r = t.getBoundingClientRect();
      const top = r.top + window.scrollY;
      start = top - window.innerHeight * 0.5;
      span = r.height;
    };
    const update = () => {
      if (!trackRef.current) return;
      const p = span > 0 ? cl((window.scrollY - start) / span) : 0;
      const pct = (p * 100).toFixed(2) + "%";
      if (fillRef.current) fillRef.current.style.height = pct;
      if (scrubRef.current) scrubRef.current.style.top = pct;
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
    }, 250);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  const NODE = (
    <span
      style={{
        position: "absolute",
        left: "50%",
        top: "-6px",
        width: "13px",
        height: "13px",
        transform: "translateX(-50%) rotate(45deg)",
        background: ACCENT,
        boxShadow: `0 0 0 6px ${BG}`,
        zIndex: 3,
      }}
    />
  );

  return (
    <section id="drumul" ref={rootRef} style={{ position: "relative", background: BG, padding: "16vh 0 18vh" }}>
      {/* ── header: eyebrow + big serif title with the small italic label nested ── */}
      <div style={{ textAlign: "center", padding: "0 6%", marginBottom: "11vh" }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: ACCENT,
            marginBottom: "18px",
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: "clamp(44px,7vw,120px)",
            lineHeight: 0.98,
            letterSpacing: "-0.02em",
            color: INK,
            margin: 0,
          }}
        >
          {title}
          <span
            style={{
              fontSize: "clamp(15px,1.5vw,26px)",
              fontStyle: "italic",
              color: "rgba(28,43,48,0.42)",
              verticalAlign: "0.9em",
              marginLeft: "0.35em",
              letterSpacing: 0,
            }}
          >
            {label}
          </span>
        </h2>
      </div>

      {/* ── the timeline: central track + stations ── */}
      <div style={{ position: "relative", maxWidth: "1160px", margin: "0 auto", padding: "0 5%" }}>
        {/* central track (faint) with a coral progress fill + riding scrubber */}
        <div
          ref={trackRef}
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: "clamp(120px,16vh,190px)",
            width: "2px",
            transform: "translateX(-1px)",
            background: "rgba(28,43,48,0.12)",
            zIndex: 1,
          }}
        >
          <div ref={fillRef} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "0%", background: ACCENT }} />
          <div
            ref={scrubRef}
            style={{
              position: "absolute",
              left: "50%",
              top: "0%",
              width: "18px",
              height: "18px",
              transform: "translate(-50%,-50%)",
              borderRadius: "999px",
              background: ACCENT,
              border: `3px solid ${BG}`,
              boxShadow: "0 4px 14px rgba(254,113,131,0.5)",
              zIndex: 4,
            }}
          />
        </div>

        {/* stations */}
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "1fr minmax(0, 40%) 1fr",
              alignItems: "center",
              padding: "8vh 0",
            }}
          >
            {/* NAME — right-aligned toward the line */}
            <div style={{ textAlign: "right", paddingRight: "clamp(24px,4vw,64px)" }}>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: "rgba(28,43,48,0.34)",
                  marginBottom: "14px",
                }}
              >
                {"0" + (i + 1) + " / 0" + steps.length}
              </div>
              <div
                style={{
                  fontFamily: serif,
                  fontWeight: 400,
                  fontSize: "clamp(30px,3.6vw,60px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.02em",
                  color: ACCENT,
                }}
              >
                {s.name}
              </div>
            </div>

            {/* IMAGE — the line runs through its centre; a node sits on top ── */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "clamp(240px,38vh,420px)",
                overflow: "hidden",
                borderRadius: "12px",
                background: IMG_BG,
                zIndex: 2,
                boxShadow: "0 24px 60px -30px rgba(28,43,48,0.5)",
              }}
            >
              <ImageSlot bg={IMG_BG} src={STEP_IMAGES[i % STEP_IMAGES.length]} alt={s.name} label={s.name} />
              {NODE}
            </div>

            {/* BODY — left-aligned away from the line */}
            <div style={{ paddingLeft: "clamp(24px,4vw,64px)" }}>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "clamp(15px,1.15vw,19px)",
                  lineHeight: 1.6,
                  color: "rgba(28,43,48,0.66)",
                  margin: 0,
                  maxWidth: "34ch",
                }}
              >
                {s.desc}
              </p>
            </div>
          </div>
        ))}

        {/* ── the path ends on the CTA ── */}
        <div style={{ position: "relative", textAlign: "center", paddingTop: "9vh" }}>
          <button
            style={{
              appearance: "none",
              border: 0,
              cursor: "pointer",
              fontFamily: FONT,
              fontSize: "16px",
              fontWeight: 800,
              letterSpacing: "0.01em",
              color: "#ffffff",
              background: "#eb7180",
              borderRadius: "999px",
              padding: "20px 46px",
              boxShadow: "0 18px 40px -18px rgba(235,113,128,0.55)",
            }}
          >
            {cta}
          </button>
        </div>
      </div>
    </section>
  );
}
