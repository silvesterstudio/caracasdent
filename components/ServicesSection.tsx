"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import ImageSlot from "./ImageSlot";

/**
 * ServicesSection — recreated from lavadental.lv/en#services, translated to the
 * Caracaș design system.
 *
 * Layout: blush block with the section title + ONE wide hero card + FOUR portrait
 * cards (natural-color photos, slow zoom on hover) whose grid straddles the seam
 * into a CORAL block holding services 06–10 as hairlined list rows.
 *
 * Every card/row opens a BOTTOM SHEET (same pattern as the expanded menu, but
 * sliding UP from the bottom) with that service's description + points.
 * The arrow circles don't change color on hover — the ↗ rotates to → instead
 * (globals.css .cd-svc-circle).
 */

const LIGHT = "#fdf0f2"; // the site-wide soft blush surface (per user)
const INK = "#1c2b30"; // brand ink (title, card ground)
const CORAL = "#eb7180"; // the 06–10 block sits on the brand pink (like the footer)
const CARD_TEXT = "#fdf0f2";
const ACCENT = "#eb7180";
const FONT = "var(--sans)";
const IMG_BG = "#dbe3e3";

// one service: card/row name + the copy shown in the bottom-sheet popup
type ServiceItem = { name: string; desc: string; points: string[] };

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

function ArrowCircle() {
  return (
    <div className="cd-btn-light cd-svc-circle" aria-hidden>
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
  cards: ServiceItem[]; // 5 services: [0] = wide hero card, [1..4] = portrait cards
  list: ServiceItem[]; // services 06..10 — the coral list rows
  serif: string;
}) {
  const pad = "4%"; // container side padding — matches "Cine suntem?"'s left offset
  const cardPad = "clamp(18px, 2.3vw, 40px)"; // in-card padding (their 29px)

  // ── bottom-sheet popup state: the item persists while the sheet slides OUT,
  //    so the content doesn't blank mid-animation ──
  const [sheetItem, setSheetItem] = useState<{ nr: string; item: ServiceItem } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheet = (nr: string, item: ServiceItem) => {
    setSheetItem({ nr, item });
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);

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

  // pink marker sweep behind "oferim?" — fires once the title scrolls into view
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          // font-display:swap — don't sweep the marker over fallback-serif text
          // that's still waiting for PP Editorial Italic (reads as "marker
          // first, text after" on slow connections); instant when fonts are in
          const arm = () => el.classList.add("cd-mark-on");
          if (!document.fonts || document.fonts.status === "loaded") arm();
          else document.fonts.ready.then(arm);
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
      {/* ── BLUSH block: title + hero card + portrait cards (grid straddles the seam
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
            {/* .cd-mark-text: keeps the text painted ABOVE the sweeping mark on WebKit */}
            <span className="cd-mark-text">{title.split(" ").slice(1).join(" ")}</span>
          </span>
        </h2>

        {/* hero card — full width, wide photo, single-line title; opens its sheet */}
        <div
          className="cd-svc-card cd-svc-hero"
          onClick={() => openSheet("01", cards[0])}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openSheet("01", cards[0])}
          style={{ position: "relative", overflow: "hidden", background: IMG_BG, aspectRatio: "1206 / 285", minHeight: "200px", cursor: "pointer" }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <ImageSlot bg={IMG_BG} src={WIDE_IMAGE} alt={cards[0].name} label={cards[0].name} />
          </div>
          <div style={{ position: "absolute", inset: 0, padding: cardPad, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={nrStyle}>01</div>
              <ArrowCircle />
            </div>
            <h3 style={{ ...cardTitleStyle, marginTop: "auto" }}>{cards[0].name}</h3>
          </div>
        </div>

        {/* portrait cards — 4 columns, pulled DOWN over the coral block (the seam
            crosses them at ~86% of their height, like the reference) */}
        <div
          className="cd-svc-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "clamp(14px, 2.3vw, 40px)",
            marginTop: "clamp(14px, 2.3vw, 40px)",
            marginBottom: "calc(clamp(180px, 29.9vw, 460px) * -0.14)",
            position: "relative",
            zIndex: 1, // paint above the coral block it hangs into
          }}
        >
          {cards.slice(1).map((item, i) => (
            <div
              key={i}
              className="cd-svc-card"
              onClick={() => openSheet(`0${i + 2}`, item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openSheet(`0${i + 2}`, item)}
              style={{ position: "relative", overflow: "hidden", background: IMG_BG, aspectRatio: "280 / 382", minHeight: "clamp(180px, 29.9vw, 460px)", cursor: "pointer" }}
            >
              <div style={{ position: "absolute", inset: 0 }}>
                <ImageSlot bg={IMG_BG} src={CARD_IMAGES[i % CARD_IMAGES.length]} alt={item.name} label={item.name} />
              </div>
              <div style={{ position: "absolute", inset: 0, padding: cardPad, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={nrStyle}>0{i + 2}</div>
                  <ArrowCircle />
                </div>
                <h3 style={{ ...cardTitleStyle, marginTop: "auto" }}>{item.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CORAL block (the brand pink, like the footer): services 06..10 as
          hairlined list rows — white text, titles on ONE row; each opens its sheet ── */}
      <div style={{ background: CORAL, padding: `calc(clamp(180px, 29.9vw, 460px) * 0.14 + clamp(56px, 8vw, 140px)) ${pad} clamp(70px, 9vw, 150px)` }}>
        {list.map((item, i) => (
          <div
            key={i}
            className="cd-svc-row"
            onClick={() => openSheet(`0${i + 6}`, item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openSheet(`0${i + 6}`, item)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              alignItems: "center",
              padding: "clamp(12px, 1.8vw, 26px) 0",
              borderTop: i === 0 ? "1px solid rgba(253,240,242,0.35)" : undefined,
              borderBottom: "1px solid rgba(253,240,242,0.35)",
              cursor: "pointer",
            }}
          >
            <div style={{ ...nrStyle, color: "#fdf0f2" }}>0{i + 6}</div>
            <h3 style={{ ...cardTitleStyle, color: "#fdf0f2", whiteSpace: "nowrap" }}>{item.name}</h3>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <ArrowCircle />
            </div>
          </div>
        ))}
      </div>

      {/* ── SERVICE SHEET — full-screen popup sliding UP from the bottom (the expanded
          menu's pattern, mirrored): blush surface, ink text, the service's info ── */}
      <div
        aria-hidden={!sheetOpen}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 120, // above the fixed header — the sheet owns the viewport
          background: LIGHT,
          color: INK,
          transform: sheetOpen ? "translateY(0)" : "translateY(100%)",
          pointerEvents: sheetOpen ? "auto" : "none",
          transition: "transform 0.9s cubic-bezier(0.16,1,0.3,1)",
          willChange: "transform",
          overflowY: "auto",
          padding: `clamp(28px, 5vh, 60px) ${pad} clamp(50px, 8vh, 100px)`,
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
                  color: INK,
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
                color: INK,
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
                  <span style={{ fontFamily: FONT, fontSize: "clamp(14px, 1.1vw, 19px)", fontWeight: 500, color: INK }}>{pt}</span>
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
