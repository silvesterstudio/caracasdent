"use client";

import { useEffect, useRef } from "react";

/**
 * SiteFooter — the coral footer rises within its own dark section: pulled up
 * under the "Drumul tău" timeline by just the dome height, its convex top edge
 * flattening as it settles (see the scroll effect). Content, top→bottom:
 *   • the smile logo + heading + a location radio picker + the contact form;
 *   • a lower block of three columns — Servicii, Clinica, Locații (the three
 *     Chișinău locations with address / phone / hours, thin seam lines between
 *     them like the aventura reference);
 *   • a bottom bar: copyright · legal links (comma-separated) · developer credit.
 * All content is blush (#fdf0f2) on the coral (#eb7180) — no pure white.
 */

const FOOT_BG = "#eb7180"; // brand coral — footer background
const LIGHT = "#fdf0f2"; // blush content on the coral footer (site-wide: no pure white)
const MUTED = "rgba(253,240,242,0.66)";
const FAINT = "rgba(253,240,242,0.5)";
const LINE = "rgba(253,240,242,0.26)";
const FONT = "var(--sans)";

type FooterCopy = {
  formTitle: string;
  callQuestion: string;
  callPhone: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  message: string;
  submit: string;
  contactTitle: string;
  address: string;
  contactEmail: string;
  mapLabel: string;
  scheduleTitle: string;
  schedule: { days: string; time: string }[];
  motto: string;
  quote: string;
  copyright: string;
  developedBy: string;
  developer: string;
  developerPhone: string;
};

// Google Maps target for "Ne găsiți aici" — the clinic's real place entry
const MAP_HREF =
  "https://www.google.com/maps/place/Caraca%C8%99-Dental/@46.9979349,28.8180547,17z/data=!4m15!1m8!3m7!1s0x40c97e9110f2d09f:0xff300d6cdc2a12d2!2sStrada+Gheorghe+Asachi+65,+MD-2028,+Chi%C8%99in%C4%83u,+Moldova!3b1!8m2!3d46.9979189!4d28.8206085!16s%2Fg%2F11bw3z0ndl!3m5!1s0x40c97e9110f2d09f:0x5d1fbf8a400aed44!8m2!3d46.9977703!4d28.8205762!16s%2Fg%2F11gznv0v0?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D";
// the clinic's socials
const SOCIAL_HREFS: Record<string, string> = {
  Instagram: "https://www.instagram.com/caracas.md/",
  Facebook: "https://www.facebook.com/Caracas.md/",
};

// the footer's domed top only overlaps the timeline by this much (= the dome
// height), so there is NO empty gap — the coral sits right under the timeline,
// and only the dome's cut corners reveal the timeline's ink behind them.
const DOME = 130;

/** the roll-up hover label (user likes it): two stacked copies, hover slides both up */
function Roll({ text }: { text: string }) {
  return (
    <span className="cd-roll">
      <span>{text}</span>
      <span aria-hidden>{text}</span>
    </span>
  );
}

export default function SiteFooter({ footer, serif }: { footer: FooterCopy; serif: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      // Flatten the dome across the footer's ENTIRE reveal — from first
      // appearing at the viewport bottom (top = vh) to resting at its settled
      // position. For a footer SHORTER than the viewport the settled top is not
      // 0 but `vh - height`, so the flatten span is min(vh, height): using the
      // full available scroll range is what keeps it from finishing too early.
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = Math.min(vh, r.height) || 1;
      const p = cl((vh - r.top) / span);
      const curve = ((1 - p) * DOME).toFixed(1);
      el.style.borderTopLeftRadius = "50% " + curve + "px";
      el.style.borderTopRightRadius = "50% " + curve + "px";
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
    const t = setTimeout(update, 200);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);


  const inputStyle: React.CSSProperties = {
    appearance: "none",
    background: "transparent",
    border: `1px solid ${LINE}`,
    borderRadius: "999px",
    padding: "18px 26px",
    fontFamily: FONT,
    fontSize: "15px",
    color: LIGHT,
    outline: "none",
    width: "100%",
  };

  const colTitle: React.CSSProperties = {
    fontFamily: FONT,
    fontSize: "clamp(13px,0.95vw,16px)",
    fontWeight: 400,
    color: FAINT,
    margin: "0 0 clamp(24px,3vh,40px)",
  };

  return (
    // the footer sits DIRECTLY under the timeline, pulled up by just the dome
    // height so its curved top overlaps the timeline's dark tail (the cut
    // corners reveal that ink). No tall rise-space → no empty gap. The convex
    // top flattens as you scroll in (see the effect above).
    <div
      ref={rootRef}
      style={{
        position: "relative",
        zIndex: 5,
        marginTop: `-${DOME}px`,
        background: FOOT_BG,
        borderTopLeftRadius: "50% 130px",
        borderTopRightRadius: "50% 130px",
        willChange: "border-radius",
        // the dome only dips at the SIDES — the centered logo can sit well inside
        // the dome strip, so only half the dome height of top padding is needed
        padding: `${DOME * 0.5}px 5% clamp(30px,5vh,60px)`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* logo (smile) centered — larger, with a big gap to the content below */}
      <div className="cd-foot-logo" style={{ display: "flex", justifyContent: "center", marginBottom: "clamp(60px,11vh,140px)" }}>
        {/* logo tinted to blush (not pure white) via a mask, so it matches
            the site-wide no-white rule; aspect from the SVG viewBox 834×346 */}
        <div
          role="img"
          aria-label="Caracaș Dental"
          style={{
            height: "clamp(70px,7.5vw,104px)",
            aspectRatio: "834 / 346",
            background: LIGHT,
            opacity: 0.95,
            WebkitMaskImage: "url(/caracas-logo.svg)",
            maskImage: "url(/caracas-logo.svg)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </div>

      {/* form title + call line + the patient/contact form — "Formular pacient"
          and Contact links land HERE (#formular), not at the page bottom */}
      <div id="formular" style={{ maxWidth: "820px", margin: "0 auto", width: "100%" }}>
        <h2
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(36px,3.6vw,58px)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: LIGHT,
            margin: "0 0 clamp(28px,4vh,44px)",
            maxWidth: "14ch",
          }}
        >
          {footer.formTitle}
        </h2>

        {/* "Ai o întrebare? Sună chiar acum" + the clinic phone */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px 14px", marginBottom: "clamp(22px,3vh,36px)", fontFamily: FONT, fontSize: "clamp(14px,1.05vw,17px)" }}>
          <span style={{ color: MUTED, fontWeight: 400 }}>{footer.callQuestion}</span>
          <a
            href={`tel:${footer.callPhone.replace(/\s+/g, "")}`}
            style={{ color: LIGHT, fontWeight: 700, letterSpacing: "0.01em", textDecoration: "underline", textUnderlineOffset: "4px" }}
          >
            {footer.callPhone}
          </a>
        </div>

        {/* the clinic's real form: Nume/Prenume, Email/Telefon, message + Trimite */}
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
          <input className="cd-foot-input" style={{ ...inputStyle, flex: "1 1 240px" }} placeholder={footer.name} />
          <input className="cd-foot-input" style={{ ...inputStyle, flex: "1 1 240px" }} placeholder={footer.surname} />
        </div>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
          <input className="cd-foot-input" style={{ ...inputStyle, flex: "1 1 240px" }} type="email" placeholder={footer.email} />
          <input className="cd-foot-input" style={{ ...inputStyle, flex: "1 1 240px" }} type="tel" placeholder={footer.phone} />
        </div>
        <div style={{ display: "flex", gap: "14px", alignItems: "stretch" }}>
          <input className="cd-foot-input" style={{ ...inputStyle, flex: 1 }} placeholder={footer.message} />
          <button
            aria-label={footer.submit}
            style={{
              appearance: "none",
              border: 0,
              cursor: "pointer",
              flex: "none",
              width: "58px",
              height: "58px",
              borderRadius: "999px",
              background: LIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h9M8.5 4l4 4-4 4" stroke="#eb7180" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* socials — the aventura circle links (placeholder hrefs for now) */}
        <div style={{ display: "flex", gap: "12px", marginTop: "clamp(24px,3.6vh,44px)" }}>
          {[
            {
              label: "Instagram",
              d: "M8 5.7A2.3 2.3 0 1 0 8 10.3 2.3 2.3 0 0 0 8 5.7Zm0-1.2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm3.8-.3a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0ZM8 2.4c-1.7 0-1.9 0-2.6 0-1.5.1-2.3.9-2.4 2.4 0 .7 0 .9 0 2.6s0 1.9 0 2.6c.1 1.5.9 2.3 2.4 2.4.7 0 .9 0 2.6 0s1.9 0 2.6 0c1.5-.1 2.3-.9 2.4-2.4 0-.7 0-.9 0-2.6s0-1.9 0-2.6c-.1-1.5-.9-2.3-2.4-2.4-.7 0-.9 0-2.6 0ZM8 1.2c1.8 0 2 0 2.7 0 2.1.1 3.3 1.3 3.4 3.4 0 .7 0 .9 0 2.7s0 2 0 2.7c-.1 2.1-1.3 3.3-3.4 3.4-.7 0-.9 0-2.7 0s-2 0-2.7 0C3.2 13.3 2 12.1 1.9 10c0-.7 0-.9 0-2.7s0-2 0-2.7C2 2.5 3.2 1.3 5.3 1.2c.7 0 .9 0 2.7 0Z",
            },
            {
              label: "Facebook",
              d: "M9.2 14V8.9h1.7l.3-2H9.2V5.6c0-.6.2-1 1-1h1.1V2.8c-.2 0-.9-.1-1.6-.1-1.6 0-2.7 1-2.7 2.8v1.4H5.2v2H7V14h2.2Z",
            },
          ].map((s, i) => (
            <a
              key={i}
              href={SOCIAL_HREFS[s.label]}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              className="cd-foot-social"
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(253,240,242,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: LIGHT,
              }}
            >
              <svg width="19" height="19" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d={s.d} />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* ── lower block: contact · orar · motto — the clinic's real details ── */}
      <div className="cd-foot-lower" style={{ width: "100%", marginTop: "clamp(64px,12vh,150px)" }}>
        <div>
          <div className="cd-foot-locs">
            {/* Detalii de contact */}
            <div>
              <div style={colTitle}>{footer.contactTitle}</div>
              <div style={{ fontFamily: FONT, fontSize: "clamp(14px,1.05vw,17px)", fontWeight: 600, lineHeight: 1.45, color: LIGHT, marginBottom: "clamp(14px,1.8vh,22px)" }}>
                {footer.address}
              </div>
              <a
                href={`tel:${footer.callPhone.replace(/\s+/g, "")}`}
                style={{ fontFamily: FONT, fontSize: "clamp(15px,1.15vw,19px)", fontWeight: 600, color: LIGHT, display: "inline-block", marginBottom: "clamp(10px,1.4vh,16px)" }}
              >
                {footer.callPhone}
              </a>
              <br />
              <a
                href={`mailto:${footer.contactEmail}`}
                style={{ fontFamily: FONT, fontSize: "clamp(13px,0.95vw,15px)", fontWeight: 500, color: LIGHT, display: "inline-block", marginBottom: "clamp(14px,2vh,24px)" }}
              >
                {footer.contactEmail}
              </a>
              <br />
              <a
                href={MAP_HREF}
                target="_blank"
                rel="noreferrer"
                style={{ fontFamily: FONT, fontSize: "clamp(13px,0.95vw,15px)", fontWeight: 600, color: LIGHT, textDecoration: "underline", textUnderlineOffset: "4px" }}
              >
                <Roll text={footer.mapLabel} />
              </a>
            </div>

            {/* Orarul săptămânii */}
            <div>
              <div style={colTitle}>{footer.scheduleTitle}</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: "18px", rowGap: "8px", fontFamily: FONT, fontSize: "clamp(13px,0.95vw,15px)", lineHeight: 1.5 }}>
                {footer.schedule.map((h, hi) => (
                  <div key={hi} style={{ display: "contents" }}>
                    <span style={{ color: FAINT, whiteSpace: "nowrap" }}>{h.days}</span>
                    <span style={{ color: LIGHT, whiteSpace: "nowrap" }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* the clinic motto + the smile quote */}
            <div>
              <div
                style={{
                  fontFamily: serif,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: "clamp(20px,1.7vw,28px)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: LIGHT,
                  marginBottom: "clamp(14px,2vh,24px)",
                }}
              >
                {footer.motto}
              </div>
              <div style={{ fontFamily: FONT, fontSize: "clamp(12px,0.9vw,14px)", fontWeight: 400, lineHeight: 1.55, color: MUTED, maxWidth: "30ch" }}>
                {footer.quote}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── bottom bar: copyright · legal · developer ── */}
      <div className="cd-foot-bar" style={{ width: "100%", marginTop: "clamp(56px,10vh,120px)", paddingTop: "clamp(24px,4vh,44px)", borderTop: `1px solid ${LINE}` }}>
        <div style={{ fontFamily: FONT, fontSize: "13px", lineHeight: 1.5, color: MUTED }}>
          Copyright © 2026
          <br />
          <span style={{ color: LIGHT }}>{footer.copyright}</span>
        </div>
        <div style={{ fontFamily: FONT, fontSize: "13px", color: MUTED }}>
          {footer.developedBy}{" "}
          <span style={{ color: LIGHT, fontWeight: 700, letterSpacing: "0.02em" }}>{footer.developer}</span>
          {" | "}
          <a href={`tel:${footer.developerPhone.replace(/\s+/g, "")}`} style={{ color: LIGHT, fontWeight: 600 }}>
            {footer.developerPhone}
          </a>
        </div>
      </div>
    </div>
  );
}
