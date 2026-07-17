"use client";

import { useEffect, useRef } from "react";
import ImageSlot from "./ImageSlot";

/**
 * ServicesSection — recreated from lavadental.lv/en#services, translated to the
 * Caracaș design system (their mint/deep-green → our light-grey/ink, their
 * Josefin Sans → our Inter Tight + editorial italic, coral on hover).
 *
 * Reference anatomy (measured live on their DOM at 1280w):
 *   • STATIC section (no pinning). Light block: big title (~9vh padding), then
 *     ONE full-width hero card (1206×285, wide photo) and FOUR portrait cards
 *     (280×382, 29px gaps, photos 600×820).
 *   • every card: duotone photo, number top-left (2vw), 58px light CIRCLE with
 *     an ↗ arrow top-right, title bottom-left (2.7vw, up to 2 lines) — content
 *     padding 29px (2.3vw), image oversized ~120% (hover zoom).
 *   • the card grid STRADDLES the light→dark seam (~86% of the card height sits
 *     in the light block, the rest hangs into the dark one).
 *   • dark block: services 06–10 as list rows — grid [1fr 1fr 1fr]: number |
 *     title (middle column!) | circle arrow right-aligned; ~15px vertical
 *     padding, hairline separators at text@0.2, text at 80% opacity.
 */

const LIGHT = "#fdf0f2"; // the site-wide soft blush surface (per user)
const INK = "#1c2b30"; // brand ink (title, card ground)
const CORAL = "#eb7180"; // the 06–10 block sits on the brand pink (like the footer)
const CARD_TEXT = "#ffffff";
const FONT = "var(--sans)";
const IMG_BG = "#dbe3e3";

// Mockup photography (Unsplash CDN, hotlinked placeholders — swap for the clinic's
// real shots later). One WIDE image for the hero card + four PORTRAIT images.
const U = (id: string, w: number, h: number, faces = false) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}&h=${h}${faces ? "&crop=faces" : ""}`;
const WIDE_IMAGE = U("1588776813941-dcf9c55e84d2", 1600, 420); // diagnostics — procedure close-up
const CARD_IMAGES = [
  U("1662837775286-7e6258c7c595", 700, 960), // igienă — chairside
  U("1567516364473-233c4b6fcfbe", 700, 960, true), // fațete — smile
  U("1588776813677-77aaf5595b83", 700, 960, true), // implanturi
  U("1489278353717-f64c6ee8a4d2", 700, 960, true), // all-on-x — finished smile
];

// photos are NATURAL color (no tint, no grayscale — per user) with a slow zoom
// on hover; the transition lives in globals.css (.cd-svc-card img).

function ArrowCircle({ inkHover = false }: { inkHover?: boolean }) {
  return (
    <div className={`cd-btn-light cd-svc-circle${inkHover ? " cd-svc-circle--ink" : ""}`} aria-hidden>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
        <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function ServicesSection({
  title,
  cards,
  list,
  serif,
}: {
  title: string;
  cards: string[]; // 5 names: [0] = wide hero card, [1..4] = portrait cards
  list: string[]; // services 06..10 — the dark list rows
  serif: string;
}) {
  const pad = "4%"; // container side padding — matches "Cine suntem?"'s left offset
  const cardPad = "clamp(18px, 2.3vw, 40px)"; // in-card padding (their 29px)

  // pink marker sweep behind "oferim?" — fires once the title scrolls into view
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("cd-mark-on");
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [title]);
  const nrStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontSize: "clamp(15px, 2vw, 30px)",
    fontWeight: 500,
    lineHeight: 1,
    color: CARD_TEXT,
  };
  const cardTitleStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: "clamp(20px, 2.7vw, 42px)",
    lineHeight: 1.22,
    letterSpacing: "-0.02em",
    color: CARD_TEXT,
    margin: 0,
  };

  return (
    <section id="servicii" style={{ position: "relative", background: LIGHT }}>
      {/* ── WHITE block: title + hero card + portrait cards (grid straddles the seam
          via a negative bottom margin matched by the block's stacking) ── */}
      <div style={{ background: LIGHT, padding: `clamp(60px, 9vw, 150px) ${pad} 0` }}>
        {/* section title — the site's heading voice, SAME size as "Cine suntem?" and
            the SAME 4.5vh gap to the content below (their outerGap) */}
        <h2
          ref={titleRef}
          style={{
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: "clamp(40px, 5.3vw, 104px)",
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            color: INK,
            margin: `0 0 4.5vh`,
          }}
        >
          {title.split(" ")[0]}{" "}
          <span
            className="cd-mark-wrap"
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "1.08em",
              lineHeight: 0.8,
              WebkitTextStrokeWidth: "0.017em",
              WebkitTextStrokeColor: "currentcolor",
            }}
          >
            {title.split(" ").slice(1).join(" ")}
          </span>
        </h2>

        {/* hero card — full width, wide photo, single-line title */}
        <div className="cd-svc-card" style={{ position: "relative", overflow: "hidden", background: IMG_BG, aspectRatio: "1206 / 285", minHeight: "200px" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <ImageSlot bg={IMG_BG} src={WIDE_IMAGE} alt={cards[0]} label={cards[0]} />
          </div>
          <div style={{ position: "absolute", inset: 0, padding: cardPad, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={nrStyle}>01</div>
              <ArrowCircle />
            </div>
            <h3 style={{ ...cardTitleStyle, marginTop: "auto" }}>{cards[0]}</h3>
          </div>
        </div>

        {/* portrait cards — 4 columns, pulled DOWN over the dark block (the seam
            crosses them at ~86% of their height, like the reference) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "clamp(14px, 2.3vw, 40px)",
            marginTop: "clamp(14px, 2.3vw, 40px)",
            marginBottom: "calc(clamp(180px, 29.9vw, 460px) * -0.14)",
            position: "relative",
            zIndex: 1, // paint above the dark block it hangs into
          }}
        >
          {cards.slice(1).map((name, i) => (
            <div key={i} className="cd-svc-card" style={{ position: "relative", overflow: "hidden", background: IMG_BG, aspectRatio: "280 / 382", minHeight: "clamp(180px, 29.9vw, 460px)" }}>
              <div style={{ position: "absolute", inset: 0 }}>
                <ImageSlot bg={IMG_BG} src={CARD_IMAGES[i % CARD_IMAGES.length]} alt={name} label={name} />
              </div>
              <div style={{ position: "absolute", inset: 0, padding: cardPad, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={nrStyle}>0{i + 2}</div>
                  <ArrowCircle />
                </div>
                <h3 style={{ ...cardTitleStyle, marginTop: "auto" }}>{name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CORAL block (the brand pink, like the footer): services 06..10 as
          hairlined list rows — white text, titles on ONE row ── */}
      <div style={{ background: CORAL, padding: `calc(clamp(180px, 29.9vw, 460px) * 0.14 + clamp(56px, 8vw, 140px)) ${pad} clamp(70px, 9vw, 150px)` }}>
        {list.map((name, i) => (
          <div
            key={i}
            className="cd-svc-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              alignItems: "center",
              padding: "clamp(12px, 1.8vw, 26px) 0",
              borderTop: i === 0 ? "1px solid rgba(255,255,255,0.35)" : undefined,
              borderBottom: "1px solid rgba(255,255,255,0.35)",
            }}
          >
            <div style={{ ...nrStyle, color: "#ffffff" }}>0{i + 6}</div>
            <h3 style={{ ...cardTitleStyle, color: "#ffffff", whiteSpace: "nowrap" }}>{name}</h3>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <ArrowCircle inkHover />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
