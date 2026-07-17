"use client";

import { useEffect, useRef, type RefObject } from "react";
import ImageSlot from "./ImageSlot";

/**
 * EchipaSection — the team, as its OWN 300vh scroll section (a pinned 100vh viewport).
 * Layout is an exact copy of the aventuradentalarts.com "Our Solutions" services
 * section, translated into the site's design system (Inter Tight + PP Editorial
 * New) — on a DEEP-ROSE sheet (dark rosewood gradient — the aventura dark mood
 * translated into the site's pink family); blush-white text, coral accent:
 *   • LEFT  — full-height COLOR doctor portrait (x0 → 50vw), wipes Dr.1 → 2 → 3 from
 *     the bottom; each incoming image ZOOM-SETTLES 120% → 100%. No bottom scrim —
 *     the photo keeps its full height (per user; the old ink fade made the dark
 *     half visually swallow the photo).
 *   • giant WHITE NAME, centered on the viewport, spanning the split, two
 *     overlapping lines (lh 0.85, ~10vw) hugging the bottom — Inter Tight 500
 *     for every word (no italic, no marker), per user.
 *   • bottom-left — "Echipa noastră:" + the three doctors as an index (active = ink).
 *   • RIGHT column (x 70.8%, w 26.9%, like the reference) — muted kicker
 *     (specialitate) → BOLD lead paragraph (bio) → color candid photo beside a
 *     hairlined, coral-arrowed list of that doctor's services.
 *   • bottom-right — the site's coral CTA (hero "Mai multe"/"Contactează-ne"
 *     geometry: 3px radius, 11/20px padding, ↗ arrow).
 * Only two typefaces: Inter Tight (FONT) + the editorial serif passed in.
 * `dr1Ref` is kept for the component interface (the old Scopul hand-off plumbing).
 */

// DEEP-ROSE theme (per user — the aventura dark mood, but in the site's pink
// family instead of near-black): dark rosewood surface, blush-white text, coral accent.
const TEXT = "#fdf0f2"; // the site's blush as the LIGHT text color
const MUTED = "rgba(253,240,242,0.62)";
const FAINT = "rgba(253,240,242,0.40)";
const LINE = "rgba(253,240,242,0.18)";
const ACCENT = "#eb7180";
const IMG_BG = "#dbe3e3"; // same neutral as the "Cine suntem?" collage placeholders
const FONT = "var(--sans)";

// dark PLUM-MAUVE (pink undertone, deliberately NOT red/burgundy — per user)
const ROSE_DEEP = "#2a1b26"; // darkest corner of the sheet
const BG = "linear-gradient(158deg,#453043 0%,#372534 55%,#2a1b26 100%)";


const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number, a: number, b: number) => cl((x - a) / (b - a));

type Doctor = {
  name: [string, string];
  spec: string;
  bio: string;
  services: [string, string, string, string];
};

export default function EchipaSection({
  doctors,
  photos,
  candids,
  book,
  serif,
  dr1Ref,
}: {
  doctors: [Doctor, Doctor, Doctor];
  photos: string[]; // per-doctor portrait
  candids: string[]; // per-doctor secondary "at work" shot for the right column
  book: string;
  serif: string;
  dr1Ref: RefObject<HTMLDivElement>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgBRef = useRef<HTMLDivElement>(null);
  const imgCRef = useRef<HTMLDivElement>(null);
  const imgBScaleRef = useRef<HTMLDivElement>(null);
  const imgCScaleRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);

  // ── this section's own scroll driver: pins for 300vh and wipes Dr. 1 → 2 → 3 ──
  useEffect(() => {
    let rootTop = 0;
    let total = 0;
    const measure = () => {
      const root = rootRef.current;
      if (!root) return;
      rootTop = root.offsetTop;
      total = root.offsetHeight - window.innerHeight;
    };

    const setT = (i: number, o: number) => {
      const el = textRefs.current[i];
      if (el) {
        el.style.opacity = o.toFixed(3);
        el.style.pointerEvents = o > 0.5 ? "auto" : "none";
      }
    };

    const update = () => {
      if (!rootRef.current) return;
      const y = window.scrollY;
      let p = total > 0 ? (y - rootTop) / total : 0;
      p = cl(p);

      const w1 = cl((p - 0.16) / 0.24); // doctor 2 wipes in
      const w2 = cl((p - 0.58) / 0.24); // doctor 3 wipes in
      // wipe = clip-path reveal from the bottom; the incoming image ZOOM-SETTLES 120% → 100%.
      if (imgBRef.current) imgBRef.current.style.clipPath = "inset(" + ((1 - w1) * 100).toFixed(2) + "% 0px 0px 0px)";
      if (imgCRef.current) imgCRef.current.style.clipPath = "inset(" + ((1 - w2) * 100).toFixed(2) + "% 0px 0px 0px)";
      if (imgBScaleRef.current) imgBScaleRef.current.style.transform = "scale(" + (1.2 - 0.2 * w1).toFixed(4) + ")";
      if (imgCScaleRef.current) imgCScaleRef.current.style.transform = "scale(" + (1.2 - 0.2 * w2).toFixed(4) + ")";

      const oA = 1 - sm(w1, 0.4, 0.6);
      const oB = sm(w1, 0.4, 0.6) * (1 - sm(w2, 0.4, 0.6));
      const oC = sm(w2, 0.4, 0.6);
      setT(0, oA);
      setT(1, oB);
      setT(2, oC);
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
    const t1 = setTimeout(() => {
      measure();
      update();
    }, 120);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(t1);
    };
  }, [doctors]);

  return (
    <section id="echipa" ref={rootRef} style={{ position: "relative", height: "300vh", background: ROSE_DEEP }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: BG,
        }}
      >
        {/* ── LEFT: full-height B&W portrait (exactly 0 → 50vw like the reference),
            wipes 1 → 2 → 3 (each zoom-settles 120%→100%), fading into the ink at
            the bottom so the centered name + index always read. ── */}
        {/* width is 50vw, NOT 50%: the sticky's 100% excludes the scrollbar, so 50%
            would leave the dark half a scrollbar-width wider than the photo (the
            width-world gotcha — same fix as the hero's video insets) */}
        <div style={{ position: "absolute", left: 0, top: 0, width: "50vw", height: "100%", overflow: "hidden", zIndex: 1 }}>
          <div ref={dr1Ref} style={{ position: "absolute", inset: 0, zIndex: 1, background: IMG_BG }}>
            <ImageSlot bg={IMG_BG} src={photos[0]} label={doctors[0].name.join(" ")} />
          </div>
          <div ref={imgBRef} style={{ position: "absolute", inset: 0, zIndex: 2, background: IMG_BG, overflow: "hidden", clipPath: "inset(100% 0px 0px 0px)" }}>
            <div ref={imgBScaleRef} style={{ width: "100%", height: "100%", transform: "scale(1.2)", willChange: "transform" }}>
              <ImageSlot bg={IMG_BG} src={photos[1]} label={doctors[1].name.join(" ")} />
            </div>
          </div>
          <div ref={imgCRef} style={{ position: "absolute", inset: 0, zIndex: 3, background: IMG_BG, overflow: "hidden", clipPath: "inset(100% 0px 0px 0px)" }}>
            <div ref={imgCScaleRef} style={{ width: "100%", height: "100%", transform: "scale(1.2)", willChange: "transform" }}>
              <ImageSlot bg={IMG_BG} src={photos[2]} label={doctors[2].name.join(" ")} />
            </div>
          </div>
        </div>

        {/* ── per-doctor content (cross-fades with the image wipe) ── */}
        {doctors.map((doc, idx) => (
          <div
            key={idx}
            ref={(el) => {
              textRefs.current[idx] = el;
            }}
            style={{ position: "absolute", inset: 0, zIndex: 10, opacity: idx === 0 ? 1 : 0 }}
          >
            {/* giant NAME — centered on the viewport, spanning the split, two
                overlapping lines hugging the bottom — ONE font for every word
                (Inter Tight 500, no italic, no marker) in WHITE, per user. */}
            <div
              style={{
                position: "absolute",
                left: 0,
                width: "100vw", // centered on the WINDOW midpoint = the photo seam (see 50vw note)
                bottom: "3.5%", // hugs the bottom; room for the ș descenders
                zIndex: 2,
                textAlign: "center",
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: "clamp(48px, 7.5vw, 156px)",
                lineHeight: 0.85,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                pointerEvents: "none",
              }}
            >
              {doc.name[0]}
              <br />
              {doc.name[1]}
            </div>

            {/* bottom-left INDEX — "Echipa noastră:" + the three doctors (this one active).
                Reference: ~0.85-0.9vw regular, active pure white, ~42px air under the
                label, block ending ~4.5% from the bottom. */}
            {/* bottom-left INDEX — on the site's 4% grid; the ACTIVE doctor reads coral */}
            <div style={{ position: "absolute", left: "4%", bottom: "4.5%", zIndex: 3, pointerEvents: "none", textShadow: "0 1px 3px rgba(46,22,28,0.55), 0 2px 18px rgba(46,22,28,0.5)" }}>
              <div style={{ fontFamily: FONT, fontSize: "clamp(13px,0.85vw,17px)", fontWeight: 400, color: MUTED, marginBottom: "clamp(24px,4.5vh,46px)" }}>
                Echipa noastră:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {doctors.map((d, di) => (
                  <div
                    key={di}
                    style={{
                      fontFamily: FONT,
                      fontSize: "clamp(13px,0.9vw,18px)",
                      fontWeight: di === idx ? 600 : 400,
                      lineHeight: 1.35,
                      color: di === idx ? "#ffffff" : FAINT, // coral melts on the pink surface
                      transition: "color 0.3s ease",
                    }}
                  >
                    {d.name[0]} {d.name[1]}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT column — the reference's exact geometry (x 70.8%, w 26.9%):
                muted kicker → BOLD lead → color candid + hairlined services list.
                (Top nudged below the fixed header; the reference has no header there.) */}
            <div style={{ position: "absolute", left: "70.8%", top: "8.5%", width: "26.9%", zIndex: 4, display: "flex", flexDirection: "column" }}>
              {/* specialty as the SITE's eyebrow (FAQ pattern: coral, uppercase, spaced) */}
              <div style={{ fontFamily: FONT, fontSize: "clamp(11px,0.8vw,13px)", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ffffff" }}>
                {doc.spec}
              </div>
              {/* bio — light and airy for the blush surface (the old 600/1.28 + 11vh
                  gap was the dark reference's voice) */}
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: "clamp(15px, 1.2vw, 24px)",
                  fontWeight: 400,
                  lineHeight: 1.5,
                  letterSpacing: "-0.01em",
                  color: "rgba(253,240,242,0.82)",
                  marginTop: "clamp(20px,4vh,44px)",
                }}
              >
                {doc.bio}
              </div>
              {/* candid row sits CLOSE under the lead (~1.6vh in the reference),
                  with a wide ~2.2vw gutter between the photo and the list */}
              <div style={{ display: "flex", gap: "clamp(16px,2.2vw,46px)", alignItems: "flex-start", marginTop: "clamp(12px,1.8vh,22px)" }}>
                {/* candid stays COLOR (like the reference) — tall 2:3, sharp corners */}
                <div
                  style={{
                    width: "42%",
                    minWidth: "120px",
                    aspectRatio: "2 / 3",
                    overflow: "hidden",
                    background: IMG_BG,
                    flex: "none",
                  }}
                >
                  <ImageSlot bg={IMG_BG} src={candids[idx]} label={`${doc.name[0]} ${doc.name[1]}`} />
                </div>
                {/* the doctor's services — hairlined rows with coral ↗ arrows */}
                <div style={{ flex: "1 1 0" }}>
                  {doc.services.map((s, si) => (
                    <div
                      key={si}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "18px 0", // the reference's rows breathe (~19px vertical)
                        borderTop: `1px solid ${LINE}`,
                        borderBottom: si === doc.services.length - 1 ? `1px solid ${LINE}` : undefined,
                      }}
                    >
                      <span style={{ fontFamily: FONT, fontSize: "clamp(13px,0.85vw,17px)", fontWeight: 400, lineHeight: 1.3, color: TEXT }}>{s}</span>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                        <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke={TEXT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── CTA (bottom-right) — WHITE on the pink surface (a pink button would melt
            into it); hovers to coral, on the 4% grid ── */}
        <button
          className="cd-btn-light"
          style={{
            position: "absolute",
            right: "4%",
            bottom: "4.5%",
            appearance: "none",
            border: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            borderRadius: "3px",
            padding: "11px 20px",
            fontFamily: FONT,
            fontSize: "clamp(14px,1.04vw,17px)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
            zIndex: 12,
          }}
        >
          {book}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
            <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
