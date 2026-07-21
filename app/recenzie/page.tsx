"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * /recenzie — the review funnel page (per user, 2026-07-21), reached from the
 * "Lasă o recenzie" button under the Recenzii marquee:
 *
 *   • the visitor picks a star rating (1–5);
 *   • 4–5 ★ → a short "thank you" state, then redirect to the clinic's Google
 *     Maps entry so the review is published there;
 *   • 1–3 ★ → a message box opens instead; "Trimite" flips to a sent-confirmed
 *     state. BY DESIGN (owner's explicit request) nothing is transmitted
 *     anywhere — there is no backend and no network call; the confirmation is
 *     UI-only. If a real inbox is ever wanted, wire onSubmit to an endpoint.
 *
 * Self-contained: its own small RO/RU dictionary + toggle (the main page's
 * language state lives inside CaracasHero and doesn't cross routes). Styling
 * follows the site system — blush #fdf0f2, ink #161516, coral #eb7180,
 * Inter Tight + the italic editorial serif, .cd-btn-pink for the actions.
 */

const LIGHT = "#fdf0f2";
const INK = "#161516";
const ACCENT = "#eb7180";
const FONT = "var(--sans)";
const SERIF = "var(--editorial)";

// The clinic's Google Maps entry (same target as the footer's "Ne găsiți aici").
// TODO(owner): for a one-tap review box, replace with the write-review deep link
//   https://search.google.com/local/writereview?placeid=<PLACE_ID>
const GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/Caraca%C8%99-Dental/@46.9979349,28.8180547,17z/data=!4m15!1m8!3m7!1s0x40c97e9110f2d09f:0xff300d6cdc2a12d2!2sStrada+Gheorghe+Asachi+65,+MD-2028,+Chi%C8%99in%C4%83u,+Moldova!3b1!8m2!3d46.9979189!4d28.8206085!16s%2Fg%2F11bw3z0ndl!3m5!1s0x40c97e9110f2d09f:0x5d1fbf8a400aed44!8m2!3d46.9977703!4d28.8205762!16s%2Fg%2F11gznv0v0?entry=ttu";

const COPY = {
  ro: {
    back: "Înapoi la site",
    title: "Cum a fost",
    titleAccent: "experiența ta?",
    sub: "Alege o notă — durează un minut și ne ajută enorm.",
    redirecting: "Mulțumim! Te ducem spre Google ca să publici recenzia…",
    formLead: "Ne pare rău că nu a fost perfect. Spune-ne ce putem îmbunătăți:",
    placeholder: "Mesajul tău…",
    send: "Trimite",
    sending: "Se trimite…",
    sentTitle: "Mulțumim!",
    sentBody: "Mesajul tău a fost trimis echipei noastre.",
  },
  ru: {
    back: "Назад на сайт",
    title: "Как прошёл",
    titleAccent: "ваш визит?",
    sub: "Поставьте оценку — это займёт минуту и очень нам поможет.",
    redirecting: "Спасибо! Перенаправляем вас в Google, чтобы опубликовать отзыв…",
    formLead: "Жаль, что не всё было идеально. Расскажите, что нам улучшить:",
    placeholder: "Ваше сообщение…",
    send: "Отправить",
    sending: "Отправляется…",
    sentTitle: "Спасибо!",
    sentBody: "Ваше сообщение отправлено нашей команде.",
  },
} as const;

export default function ReviewPage() {
  const [lang, setLang] = useState<"ro" | "ru">("ro");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [msg, setMsg] = useState("");
  const [phase, setPhase] = useState<"idle" | "redirecting" | "sending" | "sent">("idle");
  const t = COPY[lang];

  const pick = (n: number) => {
    if (phase === "redirecting" || phase === "sending" || phase === "sent") return;
    setRating(n);
    if (n >= 4) {
      // the happy path goes public: a beat to read the line, then Google
      setPhase("redirecting");
      setTimeout(() => {
        window.location.href = GOOGLE_REVIEW_URL;
      }, 1200);
    }
  };

  const submit = () => {
    if (!msg.trim() || phase !== "idle") return;
    // intentionally no network call — see the header comment
    setPhase("sending");
    setTimeout(() => setPhase("sent"), 900);
  };

  const showForm = rating > 0 && rating <= 3;

  return (
    <main style={{ minHeight: "100svh", background: LIGHT, color: INK, display: "flex", flexDirection: "column" }}>
      {/* ── top bar: back link + language toggle ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "clamp(16px, 2vw, 28px) clamp(16px, 2.34vw, 40px)" }}>
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: FONT, fontSize: "14px", fontWeight: 500, color: INK, textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.back}
        </Link>
        <div style={{ display: "flex", gap: "10px", fontFamily: FONT, fontSize: "13px", fontWeight: 600 }}>
          {(["ro", "ru"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                appearance: "none",
                background: "none",
                border: 0,
                cursor: "pointer",
                padding: "2px 0",
                fontFamily: FONT,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: lang === l ? INK : "rgba(22,21,22,0.4)",
                borderBottom: lang === l ? `2px solid ${ACCENT}` : "2px solid transparent",
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── the funnel ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 clamp(16px, 4vw, 40px) 10vh" }}>
        <div style={{ width: "100%", maxWidth: "560px", textAlign: "center" }}>
          {/* logo — the footer's blush-mask technique, tinted ink on the light page */}
          <div
            role="img"
            aria-label="Caracaș Dental"
            style={{
              height: "56px",
              aspectRatio: "834 / 346",
              margin: "0 auto clamp(28px, 5vh, 48px)",
              background: INK,
              opacity: 0.9,
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

          <h1 style={{ fontFamily: FONT, fontWeight: 500, fontSize: "clamp(30px, 7vw, 46px)", lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 14px" }}>
            {t.title}{" "}
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: "1.08em" }}>{t.titleAccent}</span>
          </h1>
          <p style={{ fontFamily: FONT, fontSize: "clamp(14px, 3.8vw, 16px)", lineHeight: 1.5, color: "rgba(22,21,22,0.55)", margin: "0 0 clamp(24px, 4vh, 40px)" }}>
            {t.sub}
          </p>

          {/* ── the stars ── */}
          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(8px, 2vw, 14px)", marginBottom: "clamp(24px, 4vh, 40px)" }}>
            {Array.from({ length: 5 }, (_, i) => {
              const n = i + 1;
              const lit = n <= (hover || rating);
              return (
                <button
                  key={n}
                  onClick={() => pick(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n}/5`}
                  style={{ appearance: "none", background: "none", border: 0, padding: "4px", cursor: "pointer", lineHeight: 0 }}
                >
                  <svg viewBox="0 0 16 16" style={{ width: "clamp(36px, 9vw, 44px)", height: "auto", transition: "transform 0.15s ease", transform: lit ? "scale(1.08)" : "scale(1)" }}>
                    <path
                      d="M8 1.6l1.94 3.94 4.35.63-3.15 3.07.74 4.33L8 11.53l-3.88 2.04.74-4.33L1.71 6.17l4.35-.63L8 1.6z"
                      fill={lit ? ACCENT : "none"}
                      stroke={lit ? ACCENT : "rgba(22,21,22,0.35)"}
                      strokeWidth="1.1"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* ── 4–5★: the Google hand-off line ── */}
          {phase === "redirecting" && (
            <p style={{ fontFamily: FONT, fontSize: "15px", lineHeight: 1.5, color: INK, margin: 0 }}>{t.redirecting}</p>
          )}

          {/* ── 1–3★: the private message form ── */}
          {showForm && phase !== "sent" && (
            <div style={{ textAlign: "left" }}>
              <p style={{ fontFamily: FONT, fontSize: "15px", lineHeight: 1.5, color: INK, margin: "0 0 12px" }}>{t.formLead}</p>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder={t.placeholder}
                rows={5}
                style={{
                  width: "100%",
                  resize: "vertical",
                  boxSizing: "border-box",
                  background: "transparent",
                  border: "1px solid rgba(22,21,22,0.3)",
                  borderRadius: "4px",
                  padding: "14px 16px",
                  fontFamily: FONT,
                  fontSize: "15px",
                  lineHeight: 1.5,
                  color: INK,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                <button
                  onClick={submit}
                  disabled={!msg.trim() || phase === "sending"}
                  className="cd-btn-pink"
                  style={{
                    appearance: "none",
                    border: 0,
                    cursor: msg.trim() ? "pointer" : "default",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    borderRadius: "3px",
                    padding: "11px 22px",
                    fontFamily: FONT,
                    fontSize: "15px",
                    fontWeight: 400,
                    letterSpacing: "-0.03em",
                    opacity: msg.trim() ? 1 : 0.55,
                  }}
                >
                  {phase === "sending" ? t.sending : t.send}
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                    <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── the sent confirmation (UI-only — nothing was transmitted) ── */}
          {phase === "sent" && (
            <div>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  margin: "0 auto 16px",
                  borderRadius: "50%",
                  background: ACCENT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 8.5L6.5 12L13 4.5" stroke={LIGHT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 500, marginBottom: "8px" }}>{t.sentTitle}</div>
              <p style={{ fontFamily: FONT, fontSize: "15px", lineHeight: 1.5, color: "rgba(22,21,22,0.6)", margin: 0 }}>{t.sentBody}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
