"use client";

import { useEffect, useRef, type RefObject } from "react";
import ImageSlot from "./ImageSlot";

/**
 * EchipaSection — the team, as its OWN 300vh scroll section (a pinned 100vh viewport).
 * Layout is an exact copy of the aventuradentalarts.com "Our Solutions" services
 * section, translated into the site's design system (Inter Tight + PP Editorial
 * New, coral accent) — on the BRAND INK (#1c2b30) as a full dark section, so the
 * team block contrasts against the white "Cine suntem?" before it and the white
 * Rezultate after it (the reference is dark too; we use our ink, not their black):
 *   • LEFT  — full-height B&W doctor portrait (x0 → 50vw), wipes Dr.1 → 2 → 3 from
 *     the bottom; each incoming image ZOOM-SETTLES 120% → 100%. The photo FADES
 *     INTO THE INK at its bottom (the reference's scrim) so text over it reads.
 *   • giant italic editorial NAME, centered on the viewport, spanning the split,
 *     two overlapping lines (lineHeight 0.85) hugging the bottom.
 *   • bottom-left — "Echipa noastră:" + the three doctors as an index (active = ink).
 *   • RIGHT column (x 70.8%, w 26.9%, like the reference) — muted kicker
 *     (specialitate) → BOLD lead paragraph (bio) → color candid photo beside a
 *     hairlined, coral-arrowed list of that doctor's services.
 *   • bottom-right — the site's coral CTA (hero "Mai multe"/"Contactează-ne"
 *     geometry: 3px radius, 11/20px padding, ↗ arrow).
 * Only two typefaces: Inter Tight (FONT) + the editorial serif passed in.
 * `dr1Ref` is kept for the component interface (the old Scopul hand-off plumbing).
 */

// dark-on-ink theme built from CaracasHero's tokens: the section bg IS the brand
// ink (#1c2b30); text flips to a warm off-white; coral stays the single accent.
const INK_BG = "#1c2b30";
const TEXT = "#eef3f4";
const MUTED = "rgba(238,243,244,0.60)";
const FAINT = "rgba(238,243,244,0.35)";
const LINE = "rgba(238,243,244,0.16)";
const ACCENT = "#eb7180";
const IMG_BG = "#dbe3e3"; // same neutral as the "Cine suntem?" collage placeholders
const FONT = "var(--sans)";

// subtle depth on the flat ink — a faint top-right glow over the content column.
// (Kept OFF the photo's bottom-left region so PHOTO_FADE meets a pure-ink bg with
// no visible seam.)
const BG =
  "radial-gradient(120% 90% at 78% 10%, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0) 55%)," + INK_BG;

// the reference's B&W portrait treatment (candids stay color, exactly like there)
const BW = "grayscale(1) contrast(1.04)";
// the reference fades its portrait into the section bg at the bottom so the text
// over it reads — into the ink, exactly like their dark scrim.
const PHOTO_FADE =
  "linear-gradient(to top, #1c2b30 1.5%, rgba(28,43,48,0.88) 11%, rgba(28,43,48,0) 42%)";

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
    <section id="echipa" ref={rootRef} style={{ position: "relative", height: "300vh", background: INK_BG }}>
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
        <div style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", overflow: "hidden", zIndex: 1 }}>
          <div ref={dr1Ref} style={{ position: "absolute", inset: 0, zIndex: 1, background: IMG_BG }}>
            <ImageSlot bg={IMG_BG} src={photos[0]} label={doctors[0].name.join(" ")} style={{ filter: BW }} />
          </div>
          <div ref={imgBRef} style={{ position: "absolute", inset: 0, zIndex: 2, background: IMG_BG, overflow: "hidden", clipPath: "inset(100% 0px 0px 0px)" }}>
            <div ref={imgBScaleRef} style={{ width: "100%", height: "100%", transform: "scale(1.2)", willChange: "transform" }}>
              <ImageSlot bg={IMG_BG} src={photos[1]} label={doctors[1].name.join(" ")} style={{ filter: BW }} />
            </div>
          </div>
          <div ref={imgCRef} style={{ position: "absolute", inset: 0, zIndex: 3, background: IMG_BG, overflow: "hidden", clipPath: "inset(100% 0px 0px 0px)" }}>
            <div ref={imgCScaleRef} style={{ width: "100%", height: "100%", transform: "scale(1.2)", willChange: "transform" }}>
              <ImageSlot bg={IMG_BG} src={photos[2]} label={doctors[2].name.join(" ")} style={{ filter: BW }} />
            </div>
          </div>
          {/* bottom fade into the section ink — the reference's dark scrim, in our brand color */}
          <div style={{ position: "absolute", inset: 0, zIndex: 4, background: PHOTO_FADE, pointerEvents: "none" }} />
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
            {/* giant editorial NAME — centered on the viewport, spanning the split,
                two overlapping italic lines hugging the bottom (the reference's
                136px / lh 0.8 Instrument Serif italic, in our editorial + ink). */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "5%", // enough room for the ș/comma descenders at lineHeight 0.85
                zIndex: 2,
                textAlign: "center",
                fontFamily: serif,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(56px, 9vw, 160px)",
                lineHeight: 0.85,
                letterSpacing: "-0.01em",
                color: TEXT,
                pointerEvents: "none",
              }}
            >
              {doc.name[0]}
              <br />
              {doc.name[1]}
            </div>

            {/* bottom-left INDEX — "Echipa noastră:" + the three doctors (this one active) */}
            <div style={{ position: "absolute", left: "2.2%", bottom: "5%", zIndex: 3, pointerEvents: "none" }}>
              <div style={{ fontFamily: FONT, fontSize: "clamp(12px,0.86vw,14px)", fontWeight: 500, color: MUTED, marginBottom: "16px" }}>
                Echipa noastră:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {doctors.map((d, di) => (
                  <div
                    key={di}
                    style={{
                      fontFamily: FONT,
                      fontSize: "clamp(12.5px,0.88vw,14.5px)",
                      fontWeight: di === idx ? 700 : 500,
                      lineHeight: 1.4,
                      color: di === idx ? TEXT : FAINT,
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
            <div style={{ position: "absolute", left: "70.8%", top: "10%", width: "26.9%", zIndex: 4, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: FONT, fontSize: "clamp(12px,0.86vw,14px)", fontWeight: 500, color: MUTED }}>
                {doc.spec}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: "clamp(15px, 1.18vw, 19px)",
                  fontWeight: 600,
                  lineHeight: 1.18,
                  letterSpacing: "-0.02em",
                  color: TEXT,
                  marginTop: "clamp(40px,9vh,90px)",
                }}
              >
                {doc.bio}
              </div>
              <div style={{ display: "flex", gap: "clamp(14px,1.3vw,24px)", alignItems: "flex-start", marginTop: "clamp(20px,4vh,42px)" }}>
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
                        padding: "11px 0",
                        borderTop: `1px solid ${LINE}`,
                        borderBottom: si === doc.services.length - 1 ? `1px solid ${LINE}` : undefined,
                      }}
                    >
                      <span style={{ fontFamily: FONT, fontSize: "clamp(12px,0.88vw,14.5px)", fontWeight: 600, lineHeight: 1.25, color: TEXT }}>{s}</span>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                        <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── CTA (bottom-right) — the site's coral hero-button geometry ── */}
        <button
          style={{
            position: "absolute",
            right: "2.2%",
            bottom: "5%",
            appearance: "none",
            border: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: ACCENT,
            color: "#ffffff",
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
            <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
