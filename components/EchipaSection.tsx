"use client";

import { useEffect, useRef, type RefObject } from "react";
import ImageSlot from "./ImageSlot";

/**
 * EchipaSection — the team, as its OWN 300vh scroll section (a pinned 100vh viewport).
 * DARK "split editorial" layout, replicated from the reference:
 *   • LEFT  — the doctor portrait (wipes Dr.1 → 2 → 3); each incoming image ZOOM-SETTLES
 *     from 120% → 100% as it wipes in (the slot never moves, only the image content scales).
 *   • giant serif NAME laid over the lower centre, spanning the split.
 *   • bottom-left — "Echipa noastră:" + the three doctors as an index (active = white).
 *   • RIGHT — a muted kicker (specialitate) → a BOLD lead paragraph (bio) → a small candid
 *     image beside a bordered, arrowed list of that doctor's services → a light "Learn More" pill.
 * Only two typefaces: Nunito (FONT) + the serif passed in (Instrument Serif).
 * Dr.1's image element is `dr1Ref`, owned by the Scopul scroll driver during the hand-off
 * (pinned & grown in from the collage, then released as this carousel's base).
 */

// dark theme
const TEXT = "#eef1f2";
const MUTED = "rgba(238,241,242,0.62)";
const FAINT = "rgba(238,241,242,0.40)";
const IMG_BG = "#cdd5d6"; // photo stand-in — light-grey so the Scopul→Echipa hand-off stays seamless
const LINE = "rgba(238,241,242,0.15)";
const FONT = "var(--font-nunito), 'Nunito', system-ui, sans-serif";

// very subtle, low-contrast dark gradient (deep navy → near-black, faint lighter sweep)
const DARK_BG =
  "radial-gradient(120% 90% at 76% 14%, rgba(80,94,128,0.22) 0%, rgba(80,94,128,0) 55%)," +
  "radial-gradient(130% 115% at 20% 108%, rgba(30,40,66,0.38) 0%, rgba(30,40,66,0) 60%)," +
  "linear-gradient(158deg, #1a1d28 0%, #101219 50%, #0a0b0f 100%)";

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
  photos: string[]; // per-doctor portrait (photos[0] is the image handed off from Scopul)
  candids: string[]; // per-doctor secondary "at work" shot for the right-column mock-up
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

      // NB: Dr. 1's image (dr1Ref) is driven by the Scopul scroll driver across the hand-off.
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
    <section ref={rootRef} style={{ position: "relative", height: "300vh", background: "#0a0b0f" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: DARK_BG,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* ── LEFT: big doctor portrait, wipes 1 → 2 → 3 (each zoom-settles 120%→100%) ── */}
        <div style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", overflow: "hidden", zIndex: 1 }}>
          {/* Dr. 1 — owned by the Scopul driver: pinned & grown in during the hand-off, then
              released to fill this slot (position:absolute, inset:0) as the carousel base. */}
          <div ref={dr1Ref} style={{ position: "absolute", inset: 0, zIndex: 1, background: IMG_BG, opacity: 0 }}>
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
            {/* giant serif NAME over the lower centre, spanning the split (line 1 italic) */}
            <div
              style={{
                position: "absolute",
                left: "33%",
                bottom: "7%",
                zIndex: 2,
                fontFamily: serif,
                fontWeight: 400,
                fontSize: "clamp(46px, 7.2vw, 126px)",
                lineHeight: 0.9,
                letterSpacing: "-0.01em",
                color: TEXT,
                pointerEvents: "none",
              }}
            >
              <span style={{ fontStyle: "italic" }}>{doc.name[0]}</span>
              <br />
              {doc.name[1]}
            </div>

            {/* bottom-left INDEX — "Echipa noastră:" + the three doctors (this one active) */}
            <div style={{ position: "absolute", left: "3.2%", bottom: "7%", zIndex: 3, pointerEvents: "none" }}>
              <div style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: MUTED, marginBottom: "18px" }}>
                Echipa noastră:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {doctors.map((d, di) => (
                  <div
                    key={di}
                    style={{
                      fontFamily: FONT,
                      fontSize: "clamp(15px,1.15vw,19px)",
                      fontWeight: di === idx ? 700 : 500,
                      lineHeight: 1.35,
                      color: di === idx ? TEXT : FAINT,
                    }}
                  >
                    {d.name[0]} {d.name[1]}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT column — kept compact & far-right (like the reference) so it never collides
                with the giant name. muted kicker → BOLD lead paragraph → candid image + list. */}
            <div style={{ position: "absolute", left: "64%", top: "8%", width: "33%", zIndex: 4, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 600, color: MUTED }}>
                {doc.spec}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: "clamp(15px, 1.25vw, 21px)",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: TEXT,
                  maxWidth: "24ch",
                  marginTop: "clamp(24px,4vh,50px)",
                }}
              >
                {doc.bio}
              </div>
              <div style={{ display: "flex", gap: "20px", alignItems: "stretch", marginTop: "clamp(22px,3.2vh,40px)" }}>
                {/* small mock-up image (doctor at work / cabinet) */}
                <div
                  style={{
                    width: "33%",
                    minWidth: "112px",
                    aspectRatio: "3 / 4",
                    borderRadius: "4px",
                    overflow: "hidden",
                    background: IMG_BG,
                    flex: "none",
                  }}
                >
                  <ImageSlot bg={IMG_BG} src={candids[idx]} label={`${doc.name[0]} ${doc.name[1]}`} />
                </div>
                {/* the doctor's services, each a bordered/arrowed row (à la reference "solutions") */}
                <div style={{ flex: "1 1 0", alignSelf: "center" }}>
                  {doc.services.map((s, si) => (
                    <div
                      key={si}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "14px",
                        padding: "11px 0",
                        borderTop: `1px solid ${LINE}`,
                        borderBottom: si === doc.services.length - 1 ? `1px solid ${LINE}` : undefined,
                      }}
                    >
                      <span style={{ fontFamily: FONT, fontSize: "clamp(13px,0.95vw,16px)", fontWeight: 600, lineHeight: 1.25, color: TEXT }}>{s}</span>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                        <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke={MUTED} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── "Learn More" pill (bottom-right, light) ── */}
        <button
          style={{
            position: "absolute",
            right: "3%",
            bottom: "7%",
            appearance: "none",
            border: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            background: "#f4f2ee",
            color: "#17171c",
            borderRadius: "999px",
            padding: "16px 20px 16px 30px",
            zIndex: 12,
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 600, letterSpacing: "0.01em" }}>{book}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flex: "none" }}>
            <path
              d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1"
              stroke="#17171c"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
