"use client";

import { useEffect, useRef } from "react";
import ImageSlot from "./ImageSlot";

/**
 * ServicesSection — a pinned "what we offer" scroll-through (mosaicist-style),
 * adapted to the Caracaș light brand system.
 *
 * The section is taller than the viewport; its inner panel is sticky. As you
 * scroll it, the tall image on the left and the numbered step title/description
 * on the right cross-fade from one service to the next, while a progress bar
 * under the image fills continuously.
 */

// Black section — the counter-beat in the light↔dark page rhythm.
const BG = "#0a0a0c";
const GRAD = "radial-gradient(120% 90% at 85% 8%, #17171b 0%, #0a0a0c 62%)";
const ACCENT = "#fe7183"; // coral accent (black theme, not blue)
const LIGHT = "#f1f1f3";
const FONT = "var(--font-nunito), 'Nunito', system-ui, sans-serif";
const IMG_BG = "#141418";

type Step = { name: string; desc: string; points?: string[] };

export default function ServicesSection({
  title,
  intro,
  steps,
  serif,
}: {
  title: string;
  intro: string;
  steps: Step[];
  serif: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<Array<HTMLDivElement | null>>([]);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const N = steps.length;

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

    let active = -1;
    const update = () => {
      if (!rootRef.current) return;
      const p = total > 0 ? cl((window.scrollY - rootTop) / total) : 0;
      if (barRef.current) barRef.current.style.width = (p * 100).toFixed(2) + "%";
      const idx = Math.min(N - 1, Math.floor(p * N));
      if (idx !== active) {
        active = idx;
        for (let i = 0; i < N; i++) {
          const im = imgRefs.current[i];
          if (im) im.style.opacity = i === idx ? "1" : "0";
          const st = stepRefs.current[i];
          if (st) {
            st.style.opacity = i === idx ? "1" : "0";
            st.style.transform = i === idx ? "translateY(0)" : "translateY(16px)";
          }
        }
      }
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
  }, [N]);

  return (
    <section ref={rootRef} style={{ position: "relative", height: `${N * 100}vh`, background: BG }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: GRAD }}>
        {/* ── TOP-CENTER: section title + intro ── */}
        <div style={{ position: "absolute", left: 0, right: 0, top: "7%", padding: "0 5%", textAlign: "center", zIndex: 2 }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: ACCENT,
              marginBottom: "14px",
            }}
          >
            {"— 04"}
          </div>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: "clamp(40px,5.2vw,96px)",
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              color: LIGHT,
            }}
          >
            {title}
          </div>
          <p
            style={{
              fontFamily: FONT,
              fontSize: "clamp(14px,1.1vw,18px)",
              lineHeight: 1.5,
              color: "rgba(241,241,243,0.55)",
              maxWidth: "620px",
              margin: "16px auto 0",
            }}
          >
            {intro}
          </p>
        </div>

        {/* ── LEFT: tall image, cross-fading per step, with a progress bar ── */}
        <div style={{ position: "absolute", left: "4%", top: "34%", width: "44%", height: "56%" }}>
          {steps.map((s, i) => (
            <div
              key={i}
              ref={(el) => {
                imgRefs.current[i] = el;
              }}
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                background: IMG_BG,
                opacity: i === 0 ? 1 : 0,
                transition: "opacity 0.55s ease",
                willChange: "opacity",
              }}
            >
              <ImageSlot bg={IMG_BG} dark label={s.name} />
            </div>
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: "-26px", height: "3px", background: "rgba(241,241,243,0.14)" }}>
            <div ref={barRef} style={{ height: "100%", width: "0%", background: ACCENT, transition: "width 0.12s linear" }} />
          </div>
        </div>

        {/* ── RIGHT: changing service NAME + more info ── */}
        <div style={{ position: "absolute", left: "54%", top: "34%", width: "42%", minHeight: "clamp(240px,50vh,520px)" }}>
          {steps.map((s, i) => (
            <div
              key={i}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                opacity: i === 0 ? 1 : 0,
                transform: i === 0 ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
                willChange: "opacity, transform",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  fontFamily: FONT,
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  color: ACCENT,
                  background: "rgba(254,113,131,0.14)",
                  padding: "5px 11px",
                  borderRadius: "6px",
                  marginBottom: "18px",
                }}
              >
                /0{i + 1}
              </div>
              <div
                style={{
                  fontFamily: serif,
                  fontWeight: 400,
                  fontSize: "clamp(38px,4.4vw,80px)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.02em",
                  color: LIGHT,
                  marginBottom: "18px",
                }}
              >
                {s.name}
              </div>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "clamp(15px,1.15vw,19px)",
                  lineHeight: 1.55,
                  color: "rgba(241,241,243,0.66)",
                  margin: "0 0 26px",
                  maxWidth: "92%",
                }}
              >
                {s.desc}
              </p>
              {s.points && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "92%" }}>
                  {s.points.map((pt, pi) => (
                    <div
                      key={pi}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        padding: "13px 0",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        borderBottom: pi === s.points!.length - 1 ? "1px solid rgba(255,255,255,0.1)" : undefined,
                      }}
                    >
                      <span style={{ fontFamily: FONT, fontSize: "clamp(14px,1.05vw,17px)", fontWeight: 600, color: "rgba(241,241,243,0.9)" }}>{pt}</span>
                      <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: ACCENT, flex: "none" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
