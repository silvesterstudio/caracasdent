"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/**
 * ReviewsSection — "Ce spun pacienții noștri": an INFINITE two-way marquee of
 * Google-style review cards (reworked 2026-07-21 from the static Dribbble wall;
 * per user: "kind of infinite and animate to left and right, slow enough to be
 * readable, these reviews from google").
 *
 *   • two rows of cards drifting in OPPOSITE directions (top ← left, bottom
 *     right →) at reading speed — 60s/75s per loop, paused on hover, disabled
 *     under prefers-reduced-motion (all in globals.css .cd-rev-*);
 *   • the seamless loop: each row's track holds TWO identical card groups and
 *     translates exactly -50% — one full group width, gap included, because the
 *     gap lives INSIDE the group as padding-right. The second group is
 *     aria-hidden (it exists only to fill the wrap-around);
 *   • cards read as Google reviews: coral star row + the multicolor Google "G",
 *     the quote, then avatar/name/treatment. Tones alternate ink/blush;
 *   • below: a coral CTA (the site's .cd-btn-pink system) → /recenzie, the
 *     review funnel page (4–5★ → Google Maps; 1–3★ → private message form).
 *
 * The header keeps the site's section-heading voice: Inter Tight + italic serif
 * accent with the pink marker sweep (same .cd-mark-wrap system as "Ce oferim?").
 */

const LIGHT = "#fdf0f2"; // the site-wide soft blush surface
const INK = "#161516"; // the site ink
const ACCENT = "#eb7180"; // brand coral (the stars)
const FONT = "var(--sans)";

// Reviews are REAL Google reviews (extracted 2026-07-22 from the clinic's own
// listing via the ListReviews RPC — see scripts/scrape-final.mjs and
// shots/reviews-extracted.json for all 99; 14 are curated here). Each item carries its
// reviewer's actual Google avatar (lh3.googleusercontent.com, =s128 for 2×
// the 40px slot); `role` is the review's month, not an invented treatment.
type Review = { q: string; name: string; role: string; avatar: string };

// the multicolor Google "G" — the cards read as Google reviews (per user)
function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Google" style={{ flex: "none" }}>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.17 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.29a12 12 0 0 0 0 10.74l3.98-3.09Z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}

function Stars() {
  return (
    <div style={{ display: "flex", gap: "4px" }} aria-label="5/5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 16 16" fill={ACCENT} aria-hidden>
          <path d="M8 1.6l1.94 3.94 4.35.63-3.15 3.07.74 4.33L8 11.53l-3.88 2.04.74-4.33L1.71 6.17l4.35-.63L8 1.6z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ r, dark }: { r: Review; dark: boolean }) {
  return (
    <div
      className="cd-rev-card"
      style={{
        flex: "none",
        width: "clamp(270px, 23vw, 350px)",
        display: "flex",
        flexDirection: "column",
        padding: "clamp(20px, 1.6vw, 28px)",
        background: dark ? INK : LIGHT,
        border: dark ? undefined : "1px solid rgba(22,21,22,0.16)", // blush-on-blush needs the hairline
        borderRadius: "4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <Stars />
        <GoogleG />
      </div>
      <p
        style={{
          fontFamily: FONT,
          fontSize: "clamp(13.5px, 1vw, 16px)",
          fontWeight: 400,
          lineHeight: 1.55,
          letterSpacing: "-0.01em",
          color: dark ? "rgba(253,240,242,0.92)" : "rgba(22,21,22,0.85)",
          margin: 0,
        }}
      >
        „{r.q}”
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto", paddingTop: "20px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny CDN avatar, sized here */}
        <img
          src={r.avatar}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", flex: "none", background: dark ? "#2a2627" : "#dbe3e3" }}
        />
        <div>
          <div style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, lineHeight: 1.25, color: dark ? LIGHT : INK }}>{r.name}</div>
          <div style={{ fontFamily: FONT, fontSize: "12.5px", fontWeight: 400, lineHeight: 1.35, color: dark ? "rgba(253,240,242,0.55)" : "rgba(22,21,22,0.55)" }}>
            {r.role}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsSection({
  title,
  titleAccent,
  blurb,
  items,
  cta,
  serif,
}: {
  title: string;
  titleAccent: string; // italic serif tail — gets the pink marker sweep
  blurb: string;
  items: Review[]; // 14 real reviews — split evenly across the two marquee rows
  cta: string; // "Lasă o recenzie" → /recenzie
  serif: string;
}) {
  // pink marker sweep behind the accent once the title scrolls into view —
  // the same .cd-mark-wrap system as "Ce oferim?" / Rezultate
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          // the serif accent is font-display:swap — on a slow connection the
          // real italic lands AFTER the title is in view, so an immediate sweep
          // reads as "marker first, text after" (per user, on mobile). Hold the
          // sweep until the fonts are in; instant when they already are.
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

  // split evenly across the two rows (← top, bottom →); an odd count puts the extra on top
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];

  return (
    <section id="recenzii" style={{ position: "relative", zIndex: 2, background: LIGHT, overflow: "hidden" }}>
      <div style={{ padding: "0 0 clamp(90px, 10vw, 180px)" }}>
        {/* ── header: title left (the shared section-heading voice), blurb right ── */}
        <div
          className="cd-rev-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "18px 40px",
            flexWrap: "wrap",
            margin: "0 clamp(16px, 2.34vw, 40px) clamp(56px, 9vw, 140px)",
          }}
        >
          <h2
            ref={titleRef}
            className="cd-rev-title"
            style={{
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: "clamp(26px, 4.3vw, 76px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: INK,
              margin: 0,
            }}
          >
            {title}{" "}
            <span className="cd-mark-wrap" style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: "1.08em", lineHeight: 0.8 }}>
              {/* .cd-mark-text: keeps the text painted ABOVE the sweeping mark on WebKit */}
              <span className="cd-mark-text">{titleAccent}</span>
            </span>
          </h2>
          {blurb && (
            <p
              style={{
                fontFamily: FONT,
                fontSize: "clamp(14px, 1.05vw, 17px)",
                fontWeight: 400,
                lineHeight: 1.5,
                color: "rgba(22,21,22,0.55)",
                margin: 0,
                maxWidth: "34ch",
                paddingBottom: "0.5em", // rides near the title's baseline, not its cap height
              }}
            >
              {blurb}
            </p>
          )}
        </div>

        {/* ── the two marquee rows: ← top, bottom → ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px, 1.25vw, 22px)" }}>
          {rows.map((row, ri) => (
            <div key={ri} className="cd-rev-marquee">
              <div className={ri === 0 ? "cd-rev-track" : "cd-rev-track cd-rev-track--rev"}>
                {/* two identical groups: the -50% keyframe lands exactly on the
                    second copy, so the loop has no visible seam */}
                {[0, 1].map((copy) => (
                  <div key={copy} className="cd-rev-group" aria-hidden={copy === 1 || undefined}>
                    {row.map((r, i) => (
                      <ReviewCard
                        key={i}
                        r={r}
                        // alternate tones; offset the second row so a dark card
                        // never sits directly under another dark card
                        dark={(i + ri) % 2 === 0}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── centered CTA → the /recenzie funnel page ── */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(40px, 5vw, 80px)" }}>
          <Link
            href="/recenzie"
            className="cd-btn-pink"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              borderRadius: "3px",
              padding: "11px 20px",
              fontFamily: FONT,
              fontSize: "clamp(14px, 1.04vw, 17px)",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
          >
            {cta}
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
              <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
