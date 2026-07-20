"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useLenis } from "lenis/react";
import ImageSlot from "./ImageSlot";
import { useIsMobile } from "./useIsMobile";

/**
 * EchipaSection — the team, as its OWN 300vh scroll section (a pinned 100vh viewport).
 * Layout is an exact copy of the aventuradentalarts.com "Our Solutions" services
 * section, translated into the site's design system (Inter Tight + PP Editorial
 * New) — on a SMOKED-TAUPE-ROSE sheet (greyed-rose gradient — the aventura dark
 * mood as an almost-neutral warm charcoal); blush-white text, coral accent:
 *   • LEFT  — full-height COLOR doctor portrait (x0 → 50vw), wipes Dr.1 → 2 → 3 from
 *     the bottom; each incoming image ZOOM-SETTLES 120% → 100%. No bottom scrim —
 *     the photo keeps its full height (per user; the old ink fade made the dark
 *     half visually swallow the photo).
 *   • giant WHITE NAME, centered on the viewport, spanning the split, two
 *     overlapping lines (lh 0.85, ~10vw) hugging the bottom — Inter Tight 500
 *     for every word (no italic, no marker), per user.
 *   • bottom-left — "Echipa noastră:" + the three doctors as an index (active = ink).
 *   • RIGHT column (x 70.8%, w 26.9%, top 13% — screenshot voice, far-right) —
 *     BIG semibold white lead (bio) → color candid photo beside a hairlined,
 *     white-arrowed list of that doctor's services; each row opens the
 *     service bottom-sheet. (The bottom-right "Programează-te" CTA was
 *     removed per user, 2026-07-17.)
 * Only two typefaces: Inter Tight (FONT) + the editorial serif passed in.
 * `dr1Ref` is kept for the component interface (the old Scopul hand-off plumbing).
 */

// INK theme (per user — flat #161516, matching the timeline/footer ink):
// dark surface, blush text, coral accent.
const TEXT = "#fdf0f2"; // the site's blush as the LIGHT text color
const MUTED = "rgba(253,240,242,0.62)";
const FAINT = "rgba(253,240,242,0.40)";
const LINE = "rgba(253,240,242,0.18)";
const ACCENT = "#eb7180";
const IMG_BG = "#dbe3e3"; // same neutral as the "Cine suntem?" collage placeholders
const FONT = "var(--sans)";

// SITE INK (per user, 2026-07-17 — replaced the smoked-taupe-rose gradient): a
// flat #161516, the same ink as the "Drumul tău" timeline, so the team section
// reads as the same dark surface. ROSE_DEEP/BG names kept to avoid churn.
const ROSE_DEEP = "#161516"; // solid surface (also the portrait backing)
const BG = "#161516";



const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number, a: number, b: number) => cl((x - a) / (b - a));

// one service: row name + the copy shown in the bottom-sheet popup (mirrors
// ServiceItem in CaracasHero — kept local to avoid an import cycle)
type Svc = { name: string; desc: string; points: string[] };

type Doctor = {
  name: [string, string];
  spec: string;
  bio: string;
  services: [Svc, Svc, Svc, Svc];
};

export default function EchipaSection({
  doctors,
  photos,
  candids,
  serif,
  dr1Ref,
}: {
  doctors: [Doctor, Doctor, Doctor];
  photos: string[]; // per-doctor portrait
  candids: string[]; // per-doctor secondary "at work" shot for the right column
  serif: string;
  dr1Ref: RefObject<HTMLDivElement>;
}) {
  // mobile (≤860): a FULL-SCREEN portrait filling the pinned frame, with the
  // name → short muted caption → that doctor's service rows stacked over its
  // darkened lower half. No section title (dropped per user). The index and the
  // candid shot stay hidden; the service rows are the SAME rows as desktop. ALL
  // scroll mechanics (pin, wipes, crossfades, zoom-settle, sheets) run identically.
  const isM = useIsMobile();

  const rootRef = useRef<HTMLDivElement>(null);
  const imgBRef = useRef<HTMLDivElement>(null);
  // ── bottom-sheet popup for a doctor's service (same pattern as ServicesSection:
  //    the item persists while the sheet slides OUT, so content doesn't blank) ──
  const [sheetItem, setSheetItem] = useState<{ nr: string; item: Svc } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheet = (nr: string, item: Svc) => {
    setSheetItem({ nr, item });
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);

  // A doctor's four services as hairlined ↗ rows, each opening the bottom sheet.
  // Shared verbatim by BOTH layouts — desktop's right column and (per user) the
  // mobile stack under the caption — so the two can never drift apart.
  const serviceRows = (doc: Doctor) =>
    doc.services.map((s, si) => (
      <div
        key={si}
        onClick={() => openSheet(`0${si + 1}`, s)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && openSheet(`0${si + 1}`, s)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          padding: isM ? "9px 0" : "clamp(14px,2.2vh,22px) 0", // roomy rows, per the screenshot
          borderTop: `1px solid ${LINE}`,
          borderBottom: si === doc.services.length - 1 ? `1px solid ${LINE}` : undefined,
          cursor: "pointer",
        }}
      >
        <span style={{ fontFamily: FONT, fontSize: isM ? "clamp(13px,3.5vw,15px)" : "clamp(14px,0.95vw,18px)", fontWeight: 500, lineHeight: 1.3, color: "#fdf0f2" }}>{s.name}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
          <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="#fdf0f2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ));

  // freeze the (Lenis) page scroll while the sheet is open; Escape closes it
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    if (sheetOpen) lenis.stop();
    else lenis.start();
    return () => lenis.start();
  }, [sheetOpen, lenis]);
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);
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

      // back-to-back wipes (no dead scroll between them — per user, "fluid"):
      // hold Dr.1 to 0.10, wipe 2 in over 0.10–0.45, wipe 3 in over 0.45–0.80,
      // hold Dr.3 for the rest.
      const w1 = cl((p - 0.1) / 0.35); // doctor 2 wipes in
      const w2 = cl((p - 0.45) / 0.35); // doctor 3 wipes in
      // wipe = clip-path reveal from the bottom; the incoming image ZOOM-SETTLES 120% → 100%.
      if (imgBRef.current) imgBRef.current.style.clipPath = "inset(" + ((1 - w1) * 100).toFixed(2) + "% 0px 0px 0px)";
      if (imgCRef.current) imgCRef.current.style.clipPath = "inset(" + ((1 - w2) * 100).toFixed(2) + "% 0px 0px 0px)";
      // settle to 1.01 (not 1.0): at exactly 1.0 subpixel rounding can leave a
      // light hairline of the slot background at the photo's right edge (= the
      // window midline); the 1% overscan keeps the image covering its box.
      if (imgBScaleRef.current) imgBScaleRef.current.style.transform = "scale(" + (1.2 - 0.19 * w1).toFixed(4) + ")";
      if (imgCScaleRef.current) imgCScaleRef.current.style.transform = "scale(" + (1.2 - 0.19 * w2).toFixed(4) + ")";

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
        {/* portrait: on mobile it fills the ENTIRE pinned frame (full-screen,
            edge to edge) — the title and the name both ride over it */}
        <div style={{ position: "absolute", left: 0, top: 0, width: isM ? "100vw" : "50vw", height: "100%", overflow: "hidden", zIndex: 1 }}>
          {/* portrait layers back onto the DARK sheet color (not the light collage
              neutral) — a light backing is what read as the "white line" when a
              settled image rounded a subpixel short of its box */}
          <div ref={dr1Ref} style={{ position: "absolute", inset: 0, zIndex: 1, background: ROSE_DEEP }}>
            <ImageSlot bg={ROSE_DEEP} dark src={photos[0]} label={doctors[0].name.join(" ")} style={{ transform: "scale(1.01)" }} />
          </div>
          <div ref={imgBRef} style={{ position: "absolute", inset: 0, zIndex: 2, background: ROSE_DEEP, overflow: "hidden", clipPath: "inset(100% 0px 0px 0px)" }}>
            <div ref={imgBScaleRef} style={{ width: "100%", height: "100%", transform: "scale(1.2)", willChange: "transform" }}>
              <ImageSlot bg={ROSE_DEEP} dark src={photos[1]} label={doctors[1].name.join(" ")} />
            </div>
          </div>
          <div ref={imgCRef} style={{ position: "absolute", inset: 0, zIndex: 3, background: ROSE_DEEP, overflow: "hidden", clipPath: "inset(100% 0px 0px 0px)" }}>
            <div ref={imgCScaleRef} style={{ width: "100%", height: "100%", transform: "scale(1.2)", willChange: "transform" }}>
              <ImageSlot bg={ROSE_DEEP} dark src={photos[2]} label={doctors[2].name.join(" ")} />
            </div>
          </div>
        </div>

        {/* MOBILE legibility scrim — the reference's photo happens to be dark where
            its name sits; our portraits are COLOUR and can be light exactly there
            (Dr. Elena's white trousers ran straight through "Caracaș"). A gradient
            confined to the bottom third only, so it never "swallows" the photo the
            way the old full ink fade did. Sits above the photo (z1), below the
            per-doctor text (z10). */}
        {isM && (
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100vw",
              // deep enough to sit behind the whole stack (name → caption → the
              // four service rows), whose top lands at ~56% of the frame
              height: "50%",
              zIndex: 2,
              pointerEvents: "none",
              background:
                "linear-gradient(to bottom, rgba(22,21,22,0) 0%, rgba(22,21,22,0.42) 32%, rgba(22,21,22,0.90) 100%)",
            }}
          />
        )}


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
                bottom: isM ? "5.5%" : "3.5%", // hugs the bottom; room for the ș descenders
                zIndex: 2,
                textAlign: "center",
                color: "#fdf0f2",
                // Desktop: nothing here is interactive, so kill taps outright.
                // Mobile: the service rows below ARE interactive, so this must stay
                // UNSET and inherit — the scroll driver turns pointer-events off on
                // the whole per-doctor wrapper when that doctor is faded out, and a
                // descendant re-enabling "auto" would defeat that and let an
                // invisible doctor's rows swallow the taps (it did exactly that).
                // The name and caption opt out individually instead.
                pointerEvents: isM ? undefined : "none",
              }}
            >
              <div
                className="cd-team-name"
                style={{
                  fontFamily: FONT, // Inter Tight 500 for every word — no italic, no marker (per user)
                  fontWeight: 500,
                  fontSize: isM ? "clamp(34px, 11.5vw, 60px)" : "clamp(48px, 7.5vw, 156px)",
                  lineHeight: 0.85,
                  letterSpacing: "-0.03em",
                  pointerEvents: "none", // the giant name must never eat a tap
                }}
              >
                {doc.name[0]}
                <br />
                {doc.name[1]}
              </div>
              {/* MOBILE caption — the reference's small muted centred paragraph,
                  sitting on the photo's dark lower region under the name. This is
                  the doctor's bio; on mobile it REPLACES the bold bio + service
                  rows, which are hidden below (per user). */}
              {isM && (
                <div
                  className="cd-team-caption"
                  style={{
                    marginTop: "clamp(12px, 2vh, 20px)",
                    // Narrower column than the rows so all three bios wrap to the
                    // SAME 3 lines (at 7% padding Dr. Elena's shorter bio fell to 2,
                    // which dropped her name 21px below the other two). minHeight
                    // locks that height in, so even if a translation runs short the
                    // names stay pinned to one position.
                    padding: "0 13%",
                    minHeight: "calc(3 * 1.45em)",
                    fontFamily: FONT,
                    fontSize: "clamp(13px, 3.6vw, 16px)",
                    fontWeight: 400,
                    lineHeight: 1.45,
                    letterSpacing: "-0.01em",
                    color: MUTED,
                    pointerEvents: "none",
                  }}
                >
                  {doc.bio}
                </div>
              )}
              {/* MOBILE service rows — the same rows desktop shows in its right
                  column, restored here directly under the caption (per user).
                  pointerEvents re-enabled: the wrapper above disables them so the
                  big name never eats taps, but these rows DO open the sheet. */}
              {isM && (
                <div style={{ marginTop: "clamp(14px, 2.4vh, 24px)", padding: "0 6%", textAlign: "left", pointerEvents: "auto" }}>
                  {serviceRows(doc)}
                </div>
              )}
            </div>

            {/* bottom-left INDEX — "Echipa noastră:" + the three doctors (this one active).
                Reference: ~0.85-0.9vw regular, active pure white, ~42px air under the
                label, block ending ~4.5% from the bottom. */}
            {/* bottom-left INDEX — on the site's 4% grid; the ACTIVE doctor reads coral */}
            <div style={{ position: "absolute", left: "4%", bottom: "4.5%", zIndex: 3, pointerEvents: "none", display: isM ? "none" : undefined }}>
              <div style={{ fontFamily: FONT, fontSize: "clamp(13px,0.85vw,17px)", fontWeight: 400, color: MUTED, marginBottom: "clamp(10px,1.8vh,20px)" }}>
                Echipa noastră:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
                {doctors.map((d, di) => (
                  <div
                    key={di}
                    style={{
                      fontFamily: FONT,
                      fontSize: "clamp(13px,0.9vw,18px)",
                      fontWeight: di === idx ? 600 : 400,
                      lineHeight: 1.25,
                      color: di === idx ? "#fdf0f2" : FAINT, // coral melts on the pink surface
                      transition: "color 0.3s ease",
                    }}
                  >
                    {d.name[0]} {d.name[1]}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT column — back at the far right (x 70.8%, w 26.9%, per user),
                keeping the screenshot's voice scaled to the narrow column: semibold
                white lead, generous air, then candid photo + services list. */}
            <div
              style={{
                position: "absolute",
                left: "70.8%",
                top: "13%",
                width: "26.9%",
                zIndex: 4,
                // mobile drops the whole right column: the bio is re-rendered as the
                // caption under the name above, and the candid + service rows are
                // gone (per user — the reference shows name + caption only)
                display: isM ? "none" : "flex",
                flexDirection: "column",
              }}
            >
              {/* bio — the screenshot's bold white headline voice */}
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: isM ? "clamp(14px, 4vw, 17px)" : "clamp(16px, 1.4vw, 27px)",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  letterSpacing: "-0.015em",
                  color: "rgba(253,240,242,0.93)",
                }}
              >
                {doc.bio}
              </div>
              {/* candid row sits WELL below the lead (screenshot has generous air),
                  with a wide gutter between the photo and the list */}
              <div style={{ display: "flex", gap: "clamp(16px,2.2vw,46px)", alignItems: "flex-start", marginTop: isM ? "16px" : "clamp(22px,4vh,52px)" }}>
                {/* candid stays COLOR (like the reference) — tall 2:3, sharp corners.
                    Hidden on mobile: the 100vh pinned frame has no room for it. */}
                <div
                  style={{
                    width: "44%",
                    minWidth: "120px",
                    aspectRatio: "2 / 3",
                    overflow: "hidden",
                    background: IMG_BG,
                    flex: "none",
                    display: isM ? "none" : undefined,
                  }}
                >
                  <ImageSlot bg={IMG_BG} src={candids[idx]} label={`${doc.name[0]} ${doc.name[1]}`} />
                </div>
                {/* the doctor's services — hairlined rows with ↗ arrows; each opens
                    the service bottom-sheet (same pattern as ServicesSection) */}
                <div style={{ flex: "1 1 0" }}>{serviceRows(doc)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SERVICE SHEET — full-screen popup sliding UP from the bottom (the
          ServicesSection pattern verbatim): blush surface, ink text ── */}
      <div
        aria-hidden={!sheetOpen}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 120, // above the fixed header — the sheet owns the viewport
          background: "#fdf0f2",
          color: "#1c2b30",
          transform: sheetOpen ? "translateY(0)" : "translateY(100%)",
          pointerEvents: sheetOpen ? "auto" : "none",
          transition: "transform 0.9s cubic-bezier(0.16,1,0.3,1)",
          willChange: "transform",
          overflowY: "auto",
          padding: "clamp(28px, 5vh, 60px) 4% clamp(50px, 8vh, 100px)",
        }}
      >
        {sheetItem && (
          <>
            {/* top bar: number chip + close circle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "clamp(36px, 8vh, 90px)" }}>
              <div
                style={{
                  display: "inline-block",
                  fontFamily: FONT,
                  fontSize: "clamp(13px, 0.95vw, 17px)",
                  fontWeight: 500,
                  color: "#1c2b30",
                  background: "rgba(28,43,48,0.07)",
                  padding: "7px 12px",
                  borderRadius: "2px",
                }}
              >
                /{sheetItem.nr}
              </div>
              <button
                onClick={closeSheet}
                aria-label="Închide"
                className="cd-btn-light cd-svc-circle"
                style={{ appearance: "none", border: 0, cursor: "pointer", boxShadow: "inset 0 0 0 1px rgba(28,43,48,0.14)" }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* service name — the site's heading voice */}
            <h3
              style={{
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: "clamp(38px, 5.3vw, 104px)",
                lineHeight: 0.98,
                letterSpacing: "-0.03em",
                color: "#1c2b30",
                margin: "0 0 clamp(20px, 4vh, 44px)",
                maxWidth: "14ch",
              }}
            >
              {sheetItem.item.name}
            </h3>

            {/* description */}
            <p
              style={{
                fontFamily: FONT,
                fontSize: "clamp(16px, 1.35vw, 24px)",
                fontWeight: 400,
                lineHeight: 1.5,
                color: "rgba(28,43,48,0.78)",
                margin: "0 0 clamp(28px, 6vh, 64px)",
                maxWidth: "52ch",
              }}
            >
              {sheetItem.item.desc}
            </p>

            {/* points — hairlined rows with a coral dot */}
            <div style={{ maxWidth: "640px" }}>
              {sheetItem.item.points.map((pt, pi) => (
                <div
                  key={pi}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "clamp(13px, 2vh, 20px) 0",
                    borderTop: "1px solid rgba(28,43,48,0.14)",
                    borderBottom: pi === sheetItem.item.points.length - 1 ? "1px solid rgba(28,43,48,0.14)" : undefined,
                  }}
                >
                  <span style={{ fontFamily: FONT, fontSize: "clamp(14px, 1.1vw, 19px)", fontWeight: 500, color: "#1c2b30" }}>{pt}</span>
                  <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: ACCENT, flex: "none" }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
