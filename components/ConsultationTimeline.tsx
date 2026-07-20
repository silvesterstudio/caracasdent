"use client";

import { useEffect, useRef } from "react";
import ImageSlot from "./ImageSlot";
import { useIsMobile } from "./useIsMobile";


/**
 * ConsultationTimeline — "Drumul tău", an EXACT replica of mosaicist.com's
 * "Our Process" timeline (per user, 2026-07-17: "make it look exactly like
 * that, with no differences"), measured off the live site at 1265px viewport
 * and converted to vw so proportions hold at any width:
 *
 *   • dark #161516 section (mosaicist's body bg — identical to our site ink);
 *   • giant centered UPPERCASE headline: Inter Tight 400, 15.54vw, lh 1.1,
 *     ls -0.06em, warm grey #dad3d1, with the small italic PP-Editorial label
 *     floating over it (their "(services)": 1.05vw at left 63.6%);
 *   • timeline component 92.85vw wide: items are a 28.6% | 42.7% | 28.6% grid
 *     with 10.12vw/2.63vw padding, columns 40.47vw tall;
 *   • per item: a 65.87vw × 36.78vw image absolutely centered (the line passes
 *     OVER it), the serif step name (3.96vw, 500) left, the 1.58vw body right,
 *     and a 1.05vw square in the centre column — name, square, and body are all
 *     position:sticky pinned at calc(50vh + 4px), riding column top → bottom;
 *   • a 3px full-height #dad3d1 track down the centre + a #f84131 red fill
 *     that always reaches the viewport centre (their fixed-position bar,
 *     re-implemented as a JS-driven absolute height — same visual, none of the
 *     negative-z stacking fragility); the pinned square sits at its tip;
 *   • activation, LATCHED once per item when its columns pin at the centre
 *     (their Webflow reveal): the LEFT and RIGHT columns animate opacity
 *     0.25 → 1, the name flips #dad3d1 → #f84131, the square flips too, and
 *     the image's BLACK VEIL eases 0.65 → 0.35 (their photos read darkened —
 *     strongly before reveal, still moody after; ours are brighter clinic
 *     shots so the resting veil keeps the reference's mood);
 *   • images PARALLAX (their inline translate3d in vw): translateY runs
 *     0 → 15.18vw linearly as the item travels viewport-bottom → out-of-view,
 *     so the photo scrolls ~15% slower than the page. Static top = ITEM top;
 *     the transform carries it down into place — measured off their inline
 *     styles (settled = 15.18vw once passed, 0 before entering);
 *   • 6.32vw fade masks (#161516 → transparent) soften the track's two ends.
 *
 * Mosaicist has no eyebrow and no CTA in this section, so neither is rendered
 * (the old eyebrow/cta props were dropped). Their fonts ARE our fonts
 * (Inter Tight + PP Editorial New), so the type matches 1:1.
 */

// mosaicist's layout, the SITE's palette (per user 2026-07-17: keep the exact
// replica but use the website's own colors/fonts — fonts already matched, so
// only the colors translate: their warm grey → the site blush, their signal
// red → the brand coral; the dark sheet is the site ink, unchanged)
const BG = "#161516"; // the site ink (also mosaicist's body bg)
const TEXT = "#fdf0f2"; // the site blush as the light text/track color
const ACCENT = "#eb7180"; // the brand coral (fill, active name/square)
const FONT = "var(--sans)";
const IMG_BG = "#2a2627"; // dark image placeholder on the dark sheet

// Wide clinic photography (Unsplash CDN) — one per step. Same verified-live IDs
// as elsewhere on the site, cropped to their 1.79:1 image ratio.
const U = (id: string, w: number, h: number, faces = false) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}&h=${h}${faces ? "&crop=faces" : ""}`;
// (unique site-wide; content VERIFIED via Unsplash alt text — two of the
// previous picks turned out to be a massage chair and a man with a pen)
const STEP_IMAGES = [
  U("1629909613654-28e377c37b09", 1600, 894), // Programare — "modern dental office with chair and equipment"
  U("1681939282781-341ac4f61996", 1600, 894), // Consultație — "a woman getting her teeth checked by a dentist"
  U("1588776814546-1ffcf47267a5", 1600, 894), // Plan — dental staff reviewing the plan on a tablet
];

// their sticky pin line: 50vh + 4px (measured 332.5 @ 657px viewport)
const PIN = "calc(50vh + 4px)";
const DRIFT_VW = 0.1518; // image parallax travel (their 15.18vw = 192px @ 1265)
const VEIL_IDLE = 0.65; // black veil over a not-yet-revealed image
const VEIL_ACTIVE = 0.35; // resting veil once revealed (keeps the moody read)

export default function ConsultationTimeline({
  title,
  label,
  steps,
  serif,
}: {
  title: string;
  label: string;
  steps: { name: string; desc: string }[];
  serif: string;
}) {
  // Mobile keeps every mechanic of the desktop stage — track, red fill, square
  // nodes, sticky pin, parallax, veil, latched reveal — but RE-ARRANGES it into
  // a LEFT RAIL (chosen by the user 2026-07-20 from a set of tested options):
  // the track runs down the left edge instead of the centre, and the photo, the
  // step name and the copy take the full remaining width. The only structural
  // difference is where the copy lives: on mobile it rides inside the name's
  // sticky box so the two pin as one block; on desktop it stays in its own
  // right-hand column. Geometry lives in globals.css (≤860 layer).
  const isM = useIsMobile();
  const compRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const colRefs = useRef<Array<HTMLDivElement | null>>([]); // left column per item — pin sensor + reveal
  const rightColRefs = useRef<Array<HTMLDivElement | null>>([]);
  const nameRefs = useRef<Array<HTMLDivElement | null>>([]);
  const squareRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imgRefs = useRef<Array<HTMLDivElement | null>>([]);
  const veilRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activated = useRef<boolean[]>([]);

  useEffect(() => {
    const update = () => {
      const comp = compRef.current;
      if (!comp) return;
      const r = comp.getBoundingClientRect();
      const threshold = window.innerHeight / 2 + 4;

      // red fill: from the component top down to the viewport centre — the
      // absolute-height equivalent of their fixed top-0/height-50vh bar
      const h = Math.max(0, Math.min(threshold - r.top, r.height));
      if (barRef.current) barRef.current.style.height = h.toFixed(1) + "px";

      // per-item activation, latched ONCE (their Webflow reveal: scrolling
      // back up does not un-highlight) — both side columns 0.25 → 1, name and
      // square grey → red, image veil 0.65 → 0.35. The styles are re-written on
      // every tick (idempotent) so a React re-render can't strand a stale value.
      colRefs.current.forEach((col, i) => {
        if (!col) return;
        if (!activated.current[i] && col.getBoundingClientRect().top <= threshold + 1) {
          activated.current[i] = true;
        }
        if (activated.current[i]) {
          const rc = rightColRefs.current[i];
          const n = nameRefs.current[i];
          const s = squareRefs.current[i];
          const v = veilRefs.current[i];
          col.style.opacity = "1";
          if (rc) rc.style.opacity = "1";
          if (n) n.style.color = ACCENT;
          if (s) s.style.background = ACCENT;
          if (v) v.style.opacity = String(VEIL_ACTIVE);
        }
      });

      // image parallax (their inline translate3d, 0 → 15.18vw): the image's
      // static top is the ITEM top; the transform carries it down as the item
      // travels viewport-bottom → out-of-view, so it scrolls ~15% slower.
      // Runs on BOTH layouts — per user the phone gets the desktop stage.
      const vh = window.innerHeight;
      const drift = DRIFT_VW * window.innerWidth;
      itemRefs.current.forEach((it, i) => {
        const img = imgRefs.current[i];
        if (!it || !img) return;
        const ir = it.getBoundingClientRect();
        const travel = vh + img.offsetHeight;
        const p = travel > 0 ? Math.max(0, Math.min(1, (vh - ir.top) / travel)) : 0;
        img.style.transform = `translate(-50%, ${(p * drift).toFixed(1)}px)`;
      });
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    const t = setTimeout(update, 250);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [steps, isM]);

  return (
    // zIndex establishes a stacking context so the z-6 fade masks below stay
    // CONTAINED — without it the bottom fade (a dark #161516 gradient) escaped to
    // the root layer and painted over the coral footer that overlaps this
    // section's tail (the "black overlay gradient" bleeding onto the footer).
    <section id="drumul" style={{ position: "relative", background: BG, zIndex: 3 }}>
      {/* ── headline: giant uppercase Inter Tight with the italic serif label
          floating over it (their .process_h-wrapper) ── */}
      <div className="cd-tl-head" style={{ position: "relative", display: "flex", justifyContent: "center", paddingTop: "7.59vw" }}>
        <h2
          className="cd-tl-title"
          style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: "15.54vw",
            lineHeight: 1.1,
            letterSpacing: "-0.06em",
            textTransform: "uppercase",
            color: TEXT,
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </h2>
        <p
          className="cd-tl-label"
          style={{
            position: "absolute",
            top: "15.43vw",
            left: "63.64%",
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 500, // the hero's italic ("noastră") weight — per user
            fontSize: "clamp(10px, 1.052vw, 18px)",
            lineHeight: 1.3,
            letterSpacing: "-0.03em",
            color: TEXT,
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </p>
      </div>

      {/* ── timeline component (their .timeline_component: 92.85vw, centered) ── */}
      <div ref={compRef} style={{ position: "relative", width: "92.85vw", margin: "0 auto" }}>
        {/* grey track — full height, 3px, OVER the images (like their z-stack);
            hidden ≤860 via .cd-tl-line (the line belongs to the desktop stage) */}
        <div
          className="cd-tl-line"
          style={{
            position: "absolute",
            left: "calc(50% - 1.5px)",
            top: 0,
            bottom: 0,
            width: "3px",
            background: TEXT,
            zIndex: 2,
          }}
        >
          {/* red fill to the viewport centre (JS height) */}
          <div ref={barRef} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "0px", background: ACCENT }} />
        </div>

        {/* ── items ── */}
        {steps.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            // the last step needs extra tail so its pinned text releases before
            // the coral footer dome climbs over it (see globals.css ≤860)
            className={i === steps.length - 1 ? "cd-tl-item cd-tl-item-last" : "cd-tl-item"}
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "28.64% 42.72% 28.64%",
              padding: "10.12vw 2.63vw",
            }}
          >
            {/* the step image — 65.87vw × 36.78vw, centered on the line; static
                top = ITEM top, the scroll driver parallaxes it 0 → 15.18vw down.
                Mobile: static in flow between name and body, full width. */}
            <div
              ref={(el) => {
                imgRefs.current[i] = el;
              }}
              className="cd-tl-img"
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                width: "65.87vw",
                height: "36.78vw",
                transform: "translate(-50%, 0)",
                willChange: "transform",
                zIndex: 1,
                overflow: "hidden",
                background: IMG_BG,
              }}
            >
              <ImageSlot bg={IMG_BG} dark src={STEP_IMAGES[i % STEP_IMAGES.length]} alt={s.name} label={s.name} />
              {/* the black veil — strong until the item reveals, moody after */}
              <div
                ref={(el) => {
                  veilRefs.current[i] = el;
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#000000",
                  opacity: VEIL_IDLE, // → VEIL_ACTIVE once revealed (latched)
                  transition: "opacity 0.6s ease",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* LEFT — the serif step name, pinned at the centre line; the WHOLE
                column reveals 0.25 → 1 (their .timeline_left opacity) */}
            <div
              ref={(el) => {
                colRefs.current[i] = el;
              }}
              className="cd-tl-col cd-tl-text"
              style={{ height: "40.47vw", opacity: 0.25, transition: "opacity 0.6s ease", zIndex: 5 }}
            >
              <div
                ref={(el) => {
                  nameRefs.current[i] = el;
                }}
                className="cd-tl-name"
                style={{
                  position: "sticky",
                  top: PIN,
                  zIndex: 5,
                  fontFamily: serif,
                  fontWeight: 500,
                  fontSize: "3.957vw",
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  color: TEXT, // → ACCENT coral once pinned (latched)
                  transition: "color 0.45s ease",
                }}
              >
                {s.name}
                {/* MOBILE: the copy rides INSIDE the name's sticky box so the two
                    pin together as one block at the centre line. Split across two
                    columns (as on desktop) a phone gives each ~132px — 3.5 words
                    a line. It sets its own colour so the name's coral latch,
                    written onto this wrapper, cannot cascade into it. */}
                {isM && (
                  <div
                    className="cd-tl-body"
                    style={{
                      fontFamily: FONT,
                      fontWeight: 400,
                      fontSize: "clamp(14px, 3.9vw, 17px)",
                      lineHeight: 1.45,
                      letterSpacing: "-0.01em",
                      color: TEXT,
                      marginTop: "10px",
                    }}
                  >
                    {s.desc}
                  </div>
                )}
              </div>
            </div>

            {/* CENTRE — the square node riding the line (their .timeline_circle:
                a 1.05vw SQUARE, border-radius 0). On mobile this column becomes
                the LEFT RAIL the track runs down (.cd-tl-rail). */}
            <div className="cd-tl-col cd-tl-rail" style={{ height: "40.47vw" }}>
              <div
                ref={(el) => {
                  squareRefs.current[i] = el;
                }}
                style={{
                  position: "sticky",
                  top: PIN,
                  zIndex: 5,
                  width: "clamp(11px, 1.052vw, 16px)",
                  height: "clamp(11px, 1.052vw, 16px)",
                  margin: "0 auto",
                  background: TEXT, // → ACCENT coral once pinned (latched)
                  transition: "background 0.45s ease",
                }}
              />
            </div>

            {/* RIGHT — the body copy, pinned with the name; the WHOLE column
                reveals 0.25 → 1 (their .timeline_right opacity). DESKTOP ONLY —
                on mobile the copy is rendered inside the name's sticky box above
                (rendered once, never both: duplicating it would put the same
                paragraph in the DOM twice). The driver null-checks this ref. */}
            {!isM && (
            <div
              ref={(el) => {
                rightColRefs.current[i] = el;
              }}
              className="cd-tl-col"
              style={{ height: "40.47vw", opacity: 0.25, transition: "opacity 0.6s ease", zIndex: 5 }}
            >
              <div
                className="cd-tl-body"
                style={{
                  position: "sticky",
                  top: PIN,
                  fontFamily: FONT,
                  fontWeight: 400,
                  fontSize: "clamp(13px, 1.579vw, 30px)",
                  lineHeight: 1.3,
                  letterSpacing: "-0.03em",
                  color: TEXT,
                }}
              >
                {s.desc}
              </div>
            </div>
            )}
          </div>
        ))}

        {/* fade masks softening the track's start and end (their overlay-fades) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6.32vw",
            background: `linear-gradient(180deg, ${BG}, rgba(10,10,10,0))`,
            zIndex: 6,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6.32vw",
            background: `linear-gradient(0deg, ${BG}, rgba(10,10,10,0))`,
            zIndex: 6,
            pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}
