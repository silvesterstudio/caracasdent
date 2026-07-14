"use client";

import { useState } from "react";

/**
 * FaqSection — a small, minimalist FAQ that sits right before the footer.
 *
 * Deliberately quiet: it borrows the site's established section header (centred
 * coral eyebrow + big Instrument-Serif title, same as ConsultationTimeline) and
 * a single centred column of hairline-divided accordion rows. No scroll driver
 * of its own — the global Lenis smooth scroll carries it, and the footer rises
 * over its lower half exactly like it does over the sections before it.
 */

const INK = "#1c2b30";
const ACCENT = "#eb7180"; // the primary brand coral used across the hero + footer
const FONT = "var(--font-nunito), 'Nunito', system-ui, sans-serif";
const DIVIDER = "rgba(28,43,48,0.12)"; // same hairline used elsewhere on the site

type FaqCopy = {
  eyebrow: string;
  title: string;
  items: { q: string; a: string }[];
};

export default function FaqSection({ faq, serif }: { faq: FaqCopy; serif: string }) {
  // single-open accordion; first row open so the section never reads as empty
  const [open, setOpen] = useState(0);

  return (
    <section style={{ position: "relative", background: "#ffffff", padding: "clamp(80px,14vh,150px) 0 clamp(120px,20vh,220px)" }}>
      {/* ── header: coral eyebrow + big serif title (matches the other sections) ── */}
      <div style={{ textAlign: "center", padding: "0 6%", marginBottom: "clamp(48px,8vh,92px)" }}>
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
          {faq.eyebrow}
        </div>
        <h2
          style={{
            fontFamily: serif,
            fontWeight: 400,
            fontSize: "clamp(38px,5vw,88px)",
            lineHeight: 0.98,
            letterSpacing: "-0.02em",
            color: INK,
            margin: 0,
          }}
        >
          {faq.title}
        </h2>
      </div>

      {/* ── the list: one centred column of hairline-divided rows ── */}
      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "0 6%", borderTop: `1px solid ${DIVIDER}` }}>
        {faq.items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ borderBottom: `1px solid ${DIVIDER}` }}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                style={{
                  appearance: "none",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "28px",
                  padding: "clamp(22px,3.2vh,32px) 0",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: "clamp(17px,1.6vw,23px)",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.25,
                    color: isOpen ? ACCENT : INK,
                    transition: "color 0.25s ease",
                  }}
                >
                  {item.q}
                </span>

                {/* +  /  −  toggle: the vertical bar collapses when open */}
                <span style={{ position: "relative", flex: "none", width: "18px", height: "18px" }}>
                  <span
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      width: "100%",
                      height: "1.6px",
                      background: ACCENT,
                      transform: "translateY(-50%)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      width: "1.6px",
                      height: "100%",
                      background: ACCENT,
                      transform: isOpen ? "translateX(-50%) scaleY(0)" : "translateX(-50%) scaleY(1)",
                      transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </span>
              </button>

              {/* answer — grid-rows 0fr→1fr gives a smooth open with no magic height */}
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.42s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  <p
                    style={{
                      fontFamily: FONT,
                      fontSize: "clamp(15px,1.15vw,18px)",
                      fontWeight: 500,
                      lineHeight: 1.62,
                      color: "rgba(28,43,48,0.66)",
                      margin: 0,
                      padding: "0 0 clamp(24px,3.4vh,34px)",
                      maxWidth: "62ch",
                    }}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
