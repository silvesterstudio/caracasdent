# Caracaș Dental

Marketing site for **Caracaș Dental** — clinică stomatologică din Chișinău (Str. Gheorghe
Asachi 65 · 068 344 333 · caracas.md). **Next.js (App Router) + TypeScript + Lenis.**
Bilingual **RO/RU** (toggle in the nav). Slogan: *"Dinții tăi, misiunea noastră"*.

## Brand

Brandbook identity applied: **coral `#FE7183`** + **aquamarine `#6AD3D1`**, **Nunito** type
(the brandbook's endorsed web font; covers Cyrillic for RU), and the real logo at
[`public/caracas-logo.svg`](public/caracas-logo.svg) in the nav.

## The hero — [`components/CaracasHero.tsx`](components/CaracasHero.tsx)

A `1000vh` scroll container with a sticky `100vh` stage; one progress value `p ∈ [0,1]`
drives every beat: media panel expands full-bleed → title fades/lifts with the video and
its letters reverse to light over the video → a single coral marquee sweeps → the "Scopul
nostru" panel with letter-by-letter reveal + collage → a dark 3-doctor carousel (Ion / Elena
/ Nicolae Caracaș) with clip-line wipes. Header auto-hides on scroll-down, returns on scroll-up.

**Smooth + performant:**
- **Lenis** eased scrolling ([`components/SmoothScroll.tsx`](components/SmoothScroll.tsx)) —
  the same technique as the reference site.
- The split animates with **`transform` only** (media full-bleed; the panel slides via
  `translateX`) — no per-frame `width` layout thrash.
- Layout reads are cached (no forced reflow per frame); the heavy per-frame work
  (clip-paths, the char-reveal loop) is gated to the scroll window where it's visible.

Images are placeholders via [`components/ImageSlot.tsx`](components/ImageSlot.tsx) — pass a
`src` for real art; the hero slot can become a `<video>`.

## Develop

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run start   # test scroll performance on the production build
```

## To finish

- Real doctor photos + hero photo/video (drop into the `ImageSlot`s via `src`).
- Review the auto-translated RU copy and the placeholder doctor bios.
- Optional: route-based i18n (`/` + `/ru`) so the `<html lang>` is correct per language for SEO.
