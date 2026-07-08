"use client";

import { useEffect, useRef } from "react";
import ImageSlot from "./ImageSlot";

/**
 * EchipaSection — the team, as a NORMAL-flow pinned section (you scroll down to it,
 * it does not rise over Scopul nostru). One doctor at a time: the big image on the
 * left wipes to the next doctor while the text on the right cross-fades. Black theme,
 * no coloured wipe line. The fused Scopul image reads straight into doctor 1's photo.
 */

const BG = "#0a0a0c";
const PANEL = "radial-gradient(120% 90% at 12% 8%, #17171b 0%, #0a0a0c 60%)";
const IMG_BG = "#141418";
const LIGHT = "#f3f3f5";
const CORAL = "#fe7183";
const FONT = "var(--font-nunito), 'Nunito', system-ui, sans-serif";

type Doctor = {
  name: [string, string];
  spec: string;
  bio: string;
  services: [string, string, string, string];
};

export default function EchipaSection({
  doctors,
  team,
  book,
  serif,
}: {
  doctors: [Doctor, Doctor, Doctor];
  team: string;
  book: string;
  serif: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgBRef = useRef<HTMLDivElement>(null);
  const imgCRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
    const sm = (x: number, a: number, b: number) => cl((x - a) / (b - a));
    let total = 0;
    let rootTop = 0;
    const measure = () => {
      const r = rootRef.current;
      if (!r) return;
      rootTop = r.offsetTop;
      total = r.offsetHeight - window.innerHeight;
    };
    const update = () => {
      if (!rootRef.current) return;
      const p = total > 0 ? cl((window.scrollY - rootTop) / total) : 0;
      const w1 = cl((p - 0.16) / 0.24); // doctor 2 wipes in
      const w2 = cl((p - 0.58) / 0.24); // doctor 3 wipes in
      if (imgBRef.current) imgBRef.current.style.clipPath = "inset(" + ((1 - w1) * 100).toFixed(2) + "% 0px 0px 0px)";
      if (imgCRef.current) imgCRef.current.style.clipPath = "inset(" + ((1 - w2) * 100).toFixed(2) + "% 0px 0px 0px)";
      const oA = 1 - sm(w1, 0.4, 0.6);
      const oB = sm(w1, 0.4, 0.6) * (1 - sm(w2, 0.4, 0.6));
      const oC = sm(w2, 0.4, 0.6);
      const set = (i: number, o: number) => {
        const el = textRefs.current[i];
        if (el) {
          el.style.opacity = o.toFixed(3);
          el.style.pointerEvents = o > 0.5 ? "auto" : "none";
        }
      };
      set(0, oA);
      set(1, oB);
      set(2, oC);
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

  return (
    <section ref={rootRef} style={{ position: "relative", height: "300vh", background: BG }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: PANEL }}>
        {/* ── LEFT: big doctor image, wipes 1 → 2 → 3 (no coloured line) ── */}
        <div style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", overflow: "hidden", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 1, background: IMG_BG }}>
            <ImageSlot bg={IMG_BG} dark label={doctors[0].name.join(" ")} />
          </div>
          <div ref={imgBRef} style={{ position: "absolute", inset: 0, zIndex: 2, background: IMG_BG, clipPath: "inset(100% 0px 0px 0px)" }}>
            <ImageSlot bg={IMG_BG} dark label={doctors[1].name.join(" ")} />
          </div>
          <div ref={imgCRef} style={{ position: "absolute", inset: 0, zIndex: 3, background: IMG_BG, clipPath: "inset(100% 0px 0px 0px)" }}>
            <ImageSlot bg={IMG_BG} dark label={doctors[2].name.join(" ")} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "42%",
              background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))",
              pointerEvents: "none",
              zIndex: 6,
            }}
          />
        </div>

        {/* ── team kicker ── */}
        <div
          style={{
            position: "absolute",
            left: "54%",
            top: "8%",
            fontFamily: FONT,
            fontSize: "13px",
            fontWeight: 800,
            color: "rgba(243,243,245,0.55)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            zIndex: 12,
          }}
        >
          {team.replace(/:\s*$/, "")}
        </div>

        {/* ── restyled book button (flat, no glow) ── */}
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
            gap: "12px",
            background: LIGHT,
            borderRadius: "10px",
            padding: "15px 26px",
            zIndex: 12,
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: "15px", fontWeight: 800, color: "#0a0a0c", letterSpacing: "0.01em" }}>{book}</span>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="#0a0a0c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* ── per-doctor text (cross-fades) ── */}
        {doctors.map((doc, idx) => (
          <div
            key={idx}
            ref={(el) => {
              textRefs.current[idx] = el;
            }}
            style={{ position: "absolute", inset: 0, zIndex: 10, opacity: idx === 0 ? 1 : 0 }}
          >
            <div style={{ position: "absolute", left: "3%", bottom: "7%", zIndex: 2 }}>
              <div style={{ fontFamily: FONT, fontSize: "13px", color: "rgba(243,243,245,0.6)", marginBottom: "12px", letterSpacing: "0.08em" }}>
                0{idx + 1} / 03
              </div>
              <div
                style={{
                  fontFamily: serif,
                  fontWeight: 400,
                  fontSize: "clamp(40px, 5.4vw, 100px)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.01em",
                  color: LIGHT,
                }}
              >
                {doc.name[0]}
                <br />
                {doc.name[1]}
              </div>
            </div>
            <div style={{ position: "absolute", left: "54%", top: "20%", width: "42%" }}>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: CORAL,
                  marginBottom: "22px",
                }}
              >
                {doc.spec}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: "clamp(16px, 1.25vw, 22px)",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: "rgba(243,243,245,0.72)",
                  maxWidth: "90%",
                  marginBottom: "34px",
                }}
              >
                {doc.bio}
              </div>
              <div style={{ width: "100%", maxWidth: "90%" }}>
                {doc.services.map((s, si) => (
                  <div
                    key={si}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 0",
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      borderBottom: si === doc.services.length - 1 ? "1px solid rgba(255,255,255,0.1)" : undefined,
                    }}
                  >
                    <span style={{ fontFamily: FONT, fontSize: "clamp(15px,1.1vw,19px)", fontWeight: 600, color: "rgba(243,243,245,0.9)" }}>{s}</span>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                      <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="rgba(243,243,245,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
