"use client";

import { useEffect, useRef, useState } from "react";
import ImageSlot from "./ImageSlot";

/**
 * SmilesShowcase — "Zâmbete care vorbesc de la sine", an exact replica of
 * lavadental.lv/en#showcase (per user, 2026-07-17) in the site's palette.
 * Measured off the live site at 1280px viewport:
 *
 *   • the WHOLE section "grows" over the previous section while scrolling down:
 *     lavadental's .overlay-section trick — the section is pulled up over the
 *     previous one by --cd-mask-h (clamp 8–10rem) with that strip clipped away,
 *     and a pure-CSS scroll-driven animation (view() timeline, first 100vh of
 *     entry) un-clips the top edge so the section unmasks UPWARD. All in
 *     globals.css (.cd-showcase-overlay); no JS.
 *   • header: max-width 740px (57.8vw), their 4.8vw display heading → our
 *     editorial serif in ink; 9vw of air before the grid.
 *   • grid (.cd-showcase-grid): 3 equal columns, 1px seams, landscape 428/284
 *     cells; cells 0 and 7 are TALL (428/568) and, with cell 4, hold muted
 *     looping VIDEOS (three unique Pexels clips — see CELL_VIDEOS); the other
 *     7 cells are photos. 3 videos + 7 photos = exactly 4 balanced rows.
 *   • every cell carries small uppercase treatment CHIPS bottom-left (12px,
 *     500, +0.6px tracking, 5/20px padding, SHARP corners — their exact chip,
 *     recolored: blush surface + ink text).
 *   • below: a centered "Vezi mai multe" in the SITE's CTA system (.cd-btn-pink,
 *     3px radius, ↗ arrow) — clicking reveals the second batch of cells
 *     (1 video + 5 photos = 2 more clean rows), then the button retires.
 *
 * Palette translation (their mint/forest → the site): section bg = blush
 * #fdf0f2, text/chips ink #161516 on blush, button coral #eb7180.
 */

const LIGHT = "#fdf0f2"; // the site-wide soft blush surface
const INK = "#161516"; // the site ink
const ACCENT = "#eb7180"; // brand coral
const FONT = "var(--sans)";
const IMG_BG = "#dbe3e3"; // the site's neutral image placeholder

// three UNIQUE clinic videos (Pexels CDN, verified live via ranged GET — none
// used anywhere else on the site; the hero video is NOT reused here, per user).
// Cells 0 and 7 are the grid's two TALL cells → portrait files; cell 4 is a
// normal landscape cell → landscape file.
// (mid-size variants — the cells are ~430px wide, full-HD files were needless weight)
const CELL_VIDEOS: Record<number, string> = {
  0: "https://videos.pexels.com/video-files/7803463/7803463-sd_540_960_30fps.mp4", // dentist checking her patient (portrait)
  4: "https://videos.pexels.com/video-files/4489274/4489274-sd_960_540_25fps.mp4", // dental check-up (landscape)
  7: "https://videos.pexels.com/video-files/6755011/6755011-hd_720_1280_25fps.mp4", // dentist working with patient (portrait)
  10: "https://videos.pexels.com/video-files/6630546/6630546-sd_960_506_25fps.mp4", // patient on the dental chair (landscape) — "Vezi mai multe" batch
};

const FIRST_BATCH = 10; // cells shown initially (4 rows); the button reveals the rest

function Chips({ tags }: { tags: string[] }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "clamp(12px, 1.54vw, 24px)",
        bottom: "clamp(12px, 1.54vw, 24px)",
        display: "flex",
        gap: "clamp(6px, 0.77vw, 12px)",
        flexWrap: "wrap",
        zIndex: 2,
      }}
    >
      {tags.map((tg, i) => (
        <span
          key={i}
          style={{
            fontFamily: FONT,
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            lineHeight: "18px",
            color: INK,
            background: LIGHT,
            padding: "5px 20px",
          }}
        >
          {tg}
        </span>
      ))}
    </div>
  );
}

export default function SmilesShowcase({
  title,
  more,
  tiles,
  images,
  serif,
}: {
  title: string;
  more: string;
  tiles: string[][]; // per-cell treatment chips (16 cells: 10 + the reveal batch)
  images: string[]; // 12 photos — cells 0/4/7/10 are videos
  serif: string;
}) {
  // "Vezi mai multe": reveals the second batch of cells, then retires itself
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? tiles.length : FIRST_BATCH;
  let imgIdx = 0; // walks `images` across the non-video cells

  // title split: head words in the site sans, the tail as the HERO's italic
  // editorial accent (the exact "noastră" treatment — per user, 2026-07-17):
  // "Zâmbete care vorbesc *de la sine*" / "Улыбки, которые говорят *сами за себя*"
  const words = title.split(" ");
  const accentCount = words.length > 3 ? 3 : 1;
  const titleHead = words.slice(0, -accentCount).join(" ");
  const titleAccent = words.slice(-accentCount).join(" ");

  // pink marker sweep behind the accent — fires once the title scrolls into
  // view (the same .cd-mark-wrap system as "Cine suntem?" / "Ce oferim?")
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
  return (
    <section id="rezultate" style={{ position: "relative", zIndex: 2 }}>
      <div
        className="cd-showcase-overlay"
        style={{
          background: LIGHT,
          // top padding = the clipped mask strip + air, so the TITLE always sits
          // BELOW the unmask edge — the strip stays a quiet blush curtain and the
          // heading is never sliced by the clip (the bug the user reported)
          padding: "calc(var(--cd-mask-h) + clamp(20px, 2.2vw, 44px)) 0 clamp(90px, 10vw, 180px)",
        }}
      >
        <div style={{ padding: "0 clamp(16px, 2.34vw, 40px)" }}>
          {/* header — their 740px-max two-line heading, in the site's heading
              voice: Inter Tight + the hero's italic editorial accent */}
          <h2
            ref={titleRef}
            className="cd-showcase-title"
            style={{
              // sized so even the longer RU title fits on ONE row (nowrap ≥720px
              // via .cd-showcase-title — a wrapped accent breaks the marker)
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: "clamp(26px, 4.3vw, 76px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: INK,
              margin: "0 0 clamp(56px, 9vw, 140px)",
            }}
          >
            {titleHead}{" "}
            <span className="cd-mark-wrap" style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: "1.08em", lineHeight: 0.8 }}>
              {titleAccent}
            </span>
          </h2>

          {/* the grid: 10 cells at first — 3 videos (0 tall, 4 landscape, 7 tall
              via the nth-child rule) + 7 photos = exactly 4 balanced rows; the
              button reveals 6 more (1 video + 5 photos = 2 more clean rows) */}
          <div className="cd-showcase-grid">
            {tiles.slice(0, shown).map((tags, i) => {
              const video = CELL_VIDEOS[i];
              return video ? (
                <div key={i} className={i === 0 ? "cd-showcase-tall" : undefined} style={{ position: "relative", background: INK }}>
                  <video
                    src={video}
                    muted
                    loop
                    autoPlay
                    playsInline
                    preload="metadata"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <Chips tags={tags} />
                </div>
              ) : (
                <div key={i} style={{ position: "relative", background: IMG_BG }}>
                  <ImageSlot bg={IMG_BG} src={images[imgIdx++]} label={tags[0]} />
                  <Chips tags={tags} />
                </div>
              );
            })}
          </div>

          {/* centered "Vezi mai multe" — the SITE's CTA system (.cd-btn-pink:
              coral, white-flood hover, 3px radius, ↗ arrow that nudges); reveals
              the second batch of cells, then retires */}
          {!expanded && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(40px, 5vw, 80px)" }}>
              <button
                className="cd-btn-pink"
                onClick={() => setExpanded(true)}
                style={{
                  appearance: "none",
                  border: 0,
                  cursor: "pointer",
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
                }}
              >
                {more}
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                  <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
