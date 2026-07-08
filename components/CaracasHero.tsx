"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ImageSlot from "./ImageSlot";
import EchipaSection from "./EchipaSection";
import ServicesSection from "./ServicesSection";
import SiteFooter from "./SiteFooter";

/**
 * CaracasHero — scroll-scrubbed split-screen hero for Caracaș Dental.
 *
 * Performance model (this is why it stays smooth alongside Lenis):
 *   • The split is animated with transform ONLY — the media is full-bleed and
 *     the left panel slides off with translateX (compositor), instead of the
 *     old per-frame `width` animation (which forced a full re-layout each frame).
 *   • Layout reads (offsetTop/offsetHeight) are cached and only refreshed on
 *     resize, so the scroll frame never forces a synchronous reflow.
 *   • The expensive per-frame work (title clip-path, the ~N-char reveal loop,
 *     the doctor-carousel clip wipes, the bridge box morph) is gated to the
 *     scroll window where it's actually visible.
 */

const FONT = "var(--font-nunito), 'Nunito', system-ui, sans-serif";
// Per-language serif: Instrument Serif for RO (Latin), Georgia for RU (Cyrillic).
const SERIF_RO = "var(--font-instrument), 'Instrument Serif', Georgia, serif";
const SERIF_RU = "Georgia, 'Times New Roman', serif";

// Brand palette (from the Caracaș Dental brandbook)
const BG = "#f4f6f6";
const INK = "#1c2b30";
const LIGHT = "#ffffff";
const CORAL = "#fe7183";
const MEDIA_BG = "#c9d2d2";

type Doctor = {
  name: [string, string];
  spec: string;
  bio: string;
  services: [string, string, string, string];
};
type Copy = {
  nav: { menu: string; services: string; patientForm: string; city: string };
  hero: { l1: string; l2: string; accent: string };
  marquee: string;
  caption: [string, string];
  goalTitle: string;
  paragraph: string;
  team: string;
  teamTitle: string;
  teamLead: string;
  book: string;
  heroMedia: string;
  collage: (n: number) => string;
  doctors: [Doctor, Doctor, Doctor];
  results: { title: string; more: string; tiles: string[][] };
  services: { title: string; intro: string; steps: { name: string; desc: string; points: string[] }[] };
  footer: {
    heading: string;
    chooseLocation: string;
    locations: [string, string, string];
    name: string;
    phone: string;
    message: string;
  };
};

const COPY: Record<"ro" | "ru", Copy> = {
  ro: {
    nav: { menu: "Meniu", services: "Servicii", patientForm: "Formular pacient", city: "Chișinău" },
    hero: { l1: "Dinții tăi,", l2: "Misiunea", accent: "noastră" },
    marquee: "Zâmbetul ca limbaj de comunicare",
    caption: ["Grijă și încredere,", "pentru fiecare generație"],
    goalTitle: "Scopul nostru",
    paragraph:
      "să oferim îngrijire dentară și estetică de talie mondială, prin tehnici avansate, tratamente personalizate și un nivel de servicii impecabil care face fiecare pacient să se simtă valoros.",
    team: "Echipa noastră:",
    teamTitle: "Echipa noastră",
    teamLead: "Medici cu experiență, dedicați fiecărui zâmbet.",
    book: "Programează-te",
    heroMedia: "Video sau fotografie",
    collage: (n) => `Imagine ${n}`,
    results: {
      title: "Zâmbete care vorbesc de la sine",
      more: "Vezi mai multe",
      tiles: [
        ["Fațete"],
        ["All-on-X"],
        ["Implanturi", "Fațete"],
        ["Endodonție"],
        ["Igienă", "Fațete"],
        ["Fațete", "Terapie"],
        ["Coroane"],
        ["Albire"],
        ["All-on-X"],
        ["Implanturi"],
      ],
    },
    services: {
      title: "Ce oferim",
      intro:
        "Fiecare tratament este planificat individual, cu tehnologie modernă și o echipă dedicată — pentru rezultate care arată și se simt naturale.",
      steps: [
        {
          name: "Implantologie",
          desc: "Implanturi și reconstrucții complete, planificate digital, cu precizie chirurgicală și rezultate de durată.",
          points: ["Implant unitar", "All-on-4 / All-on-6", "Sinus lift", "Grefă osoasă"],
        },
        {
          name: "Estetică dentară",
          desc: "Transformăm zâmbetul cu tehnici minim invazive, pentru un rezultat natural și luminos.",
          points: ["Fațete ceramice", "Albire profesională", "Bonding estetic", "Digital Smile Design"],
        },
        {
          name: "Stomatologie terapeutică",
          desc: "Îngrijire completă care păstrează dinții sănătoși, funcționali și frumoși pe termen lung.",
          points: ["Tratament de canal", "Obturații estetice", "Coroane & punți", "Parodontologie"],
        },
        {
          name: "Chirurgie orală",
          desc: "Intervenții avansate realizate cu grijă și confort, de la extracții complexe la regenerare osoasă.",
          points: ["Extracții complexe", "Sinus lift", "Chisturi & tumori", "Regenerare osoasă"],
        },
      ],
    },
    footer: {
      heading: "Pregătit să-ți transformi zâmbetul? Programează o vizită.",
      chooseLocation: "Alege locația:",
      locations: ["Centru", "Botanica", "Ciocana"],
      name: "Nume",
      phone: "Număr de telefon",
      message: "Mesaj",
    },
    doctors: [
      {
        name: ["Dr. Ion", "Caracaș"],
        spec: "Chirurgie & Implantologie",
        bio: "De la implanturi la reconstrucții complexe, Dr. Ion Caracaș îmbină precizia chirurgicală cu grija pentru fiecare pacient.",
        services: ["Implanturi dentare", "Chirurgie orală", "Sinus lift", "Extracții complexe"],
      },
      {
        name: ["Dr. Elena", "Caracaș"],
        spec: "Stomatologie Terapeutică",
        bio: "De la tratamente de canal la restaurări estetice, Dr. Elena Caracaș redă sănătatea și frumusețea fiecărui zâmbet.",
        services: ["Tratament de canal", "Obturații estetice", "Coroane & punți", "Tratament parodontal"],
      },
      {
        name: ["Dr. Nicolae", "Caracaș"],
        spec: "Stomatologie Estetică",
        bio: "Cu o abordare atentă și artistică, Dr. Nicolae Caracaș creează zâmbete naturale, luminoase și pline de încredere.",
        services: ["Fațete dentare", "Albire profesională", "Bonding estetic", "Design digital al zâmbetului"],
      },
    ],
  },
  ru: {
    nav: { menu: "Меню", services: "Услуги", patientForm: "Анкета пациента", city: "Кишинёв" },
    hero: { l1: "Ваши зубы,", l2: "наша", accent: "цель" },
    marquee: "Улыбка — язык общения",
    caption: ["Забота и доверие,", "для каждого поколения"],
    goalTitle: "Наша цель",
    paragraph:
      "предоставлять стоматологический и эстетический уход мирового уровня — с помощью передовых методик, индивидуальных решений и безупречного сервиса, при котором каждый пациент чувствует себя ценным.",
    team: "Наша команда:",
    teamTitle: "Наша команда",
    teamLead: "Опытные врачи, преданные каждой улыбке.",
    book: "Записаться",
    heroMedia: "Видео или фото",
    collage: (n) => `Изображение ${n}`,
    results: {
      title: "Улыбки, которые говорят сами за себя",
      more: "Показать больше",
      tiles: [
        ["Виниры"],
        ["All-on-X"],
        ["Импланты", "Виниры"],
        ["Эндодонтия"],
        ["Гигиена", "Виниры"],
        ["Виниры", "Терапия"],
        ["Коронки"],
        ["Отбеливание"],
        ["All-on-X"],
        ["Импланты"],
      ],
    },
    services: {
      title: "Что мы предлагаем",
      intro:
        "Каждое лечение планируется индивидуально, с современными технологиями и преданной командой — ради результата, который выглядит и ощущается естественно.",
      steps: [
        {
          name: "Имплантология",
          desc: "Импланты и полные реконструкции с цифровым планированием, хирургической точностью и долговечным результатом.",
          points: ["Одиночный имплант", "All-on-4 / All-on-6", "Синус-лифтинг", "Костная пластика"],
        },
        {
          name: "Эстетическая стоматология",
          desc: "Преображаем улыбку минимально инвазивными методами — ради естественного и сияющего результата.",
          points: ["Керамические виниры", "Профессиональное отбеливание", "Эстетический бондинг", "Digital Smile Design"],
        },
        {
          name: "Терапевтическая стоматология",
          desc: "Комплексный уход, сохраняющий зубы здоровыми, функциональными и красивыми надолго.",
          points: ["Лечение каналов", "Эстетические пломбы", "Коронки и мосты", "Пародонтология"],
        },
        {
          name: "Оральная хирургия",
          desc: "Продвинутые вмешательства с заботой и комфортом — от сложных удалений до регенерации кости.",
          points: ["Сложные удаления", "Синус-лифтинг", "Кисты и опухоли", "Регенерация кости"],
        },
      ],
    },
    footer: {
      heading: "Готовы преобразить улыбку? Запишитесь на визит.",
      chooseLocation: "Выберите локацию:",
      locations: ["Центр", "Ботаника", "Чеканы"],
      name: "Имя",
      phone: "Номер телефона",
      message: "Сообщение",
    },
    doctors: [
      {
        name: ["Д-р Ион", "Каракаш"],
        spec: "Хирургия и имплантология",
        bio: "От имплантов до сложных реконструкций — доктор Ион Каракаш сочетает хирургическую точность с заботой о каждом пациенте.",
        services: ["Зубные импланты", "Оральная хирургия", "Синус-лифтинг", "Сложные удаления"],
      },
      {
        name: ["Д-р Елена", "Каракаш"],
        spec: "Терапевтическая стоматология",
        bio: "От лечения каналов до эстетических реставраций — доктор Елена Каракаш возвращает здоровье и красоту каждой улыбке.",
        services: ["Лечение каналов", "Эстетические пломбы", "Коронки и мосты", "Лечение пародонта"],
      },
      {
        name: ["Д-р Николае", "Каракаш"],
        spec: "Эстетическая стоматология",
        bio: "С внимательным и артистичным подходом доктор Николае Каракаш создаёт естественные, сияющие улыбки, полные уверенности.",
        services: ["Виниры", "Профессиональное отбеливание", "Эстетический бондинг", "Цифровой дизайн улыбки"],
      },
    ],
  },
};

function HeroTitle({
  hero,
  color,
  serif,
}: {
  hero: Copy["hero"];
  color: string;
  serif: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: "45%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "96%",
        textAlign: "center",
        fontFamily: serif,
        fontWeight: 400,
        lineHeight: 0.92,
        letterSpacing: "-0.015em",
      }}
    >
      <div style={{ fontSize: "clamp(44px, 7.4vw, 138px)", color }}>{hero.l1}</div>
      <div style={{ fontSize: "clamp(44px, 7.4vw, 138px)", color }}>
        {hero.l2}{" "}
        <span style={{ fontStyle: "italic", fontWeight: 400, color }}>{hero.accent}</span>
      </div>
    </div>
  );
}

// ── Results / portfolio ──────────────────────────────────────────────────────
// One "block" is a 3-col × 2-row grid: a tall image spanning both rows on one
// side, and the other two columns each split into 2 stacked cells. The `reversed`
// flag mirrors the tall image to the opposite side for the alternating block.
const RES_PILL: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: INK,
  background: "rgba(244,246,246,0.92)",
  padding: "7px 13px",
  borderRadius: "6px",
};

function ResTile({ tags, area }: { tags: string[]; area: string }) {
  return (
    <div style={{ gridArea: area, position: "relative", overflow: "hidden", background: "#dfe6e6" }}>
      <ImageSlot bg="#dfe6e6" label={tags[0]} />
      <div style={{ position: "absolute", left: "14px", bottom: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {tags.map((tg, i) => (
          <span key={i} style={RES_PILL}>
            {tg}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultsBlock({ tiles, reversed = false }: { tiles: string[][]; reversed?: boolean }) {
  // tiles[0] is the tall image; [1..4] fill the two split columns
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gridTemplateAreas: reversed ? '"a c big" "b d big"' : '"big a c" "big b d"',
        gap: "clamp(10px,1vw,18px)",
        height: "clamp(560px,86vh,900px)",
      }}
    >
      <ResTile tags={tiles[0]} area="big" />
      <ResTile tags={tiles[1]} area="a" />
      <ResTile tags={tiles[2]} area="b" />
      <ResTile tags={tiles[3]} area="c" />
      <ResTile tags={tiles[4]} area="d" />
    </div>
  );
}

export type CaracasHeroProps = {
  scrubHeight?: number;
  marqueeTravel?: number;
  panelColor?: string;
};

export default function CaracasHero({
  scrubHeight = 600,
  marqueeTravel = 430,
  panelColor = BG,
}: CaracasHeroProps) {
  const [lang, setLang] = useState<"ro" | "ru">("ro");
  const t = COPY[lang];
  const marqueeWords = t.marquee.split(" ");
  const marqueeLast = marqueeWords[marqueeWords.length - 1];
  const marqueeHead = marqueeWords.slice(0, -1).join(" ");
  const serifFont = lang === "ru" ? SERIF_RU : SERIF_RO;

  // ── refs ─────────────────────────────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const mediaInnerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const blackGradRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const headDarkRef = useRef<HTMLDivElement>(null);
  const headLightRef = useRef<HTMLDivElement>(null);
  const designingRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeLastRef = useRef<HTMLSpanElement>(null);
  const goalRef = useRef<HTMLDivElement>(null);
  const imgsRef = useRef<Array<HTMLDivElement | null>>([]);
  const charsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const chunkRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const collageAreaRef = useRef<HTMLDivElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);
  const fusedRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const imgShownRef = useRef<boolean[]>([]);
  const forceRevealRef = useRef(false);
  const updateRef = useRef<() => void>(() => {});
  const measureRef = useRef<() => void>(() => {});

  // ── paragraph → per-word / per-character spans. The words keep whole on their
  //    line (nowrap) while every character darkens grey→ink in reading order as
  //    the reveal sweep passes over it (mid-word reveal, like the reference). ──
  const paragraphNodes = useMemo(() => {
    charsRef.current = [];
    const words = String(t.paragraph).split(" ");
    let idx = 0;
    const nodes: React.ReactNode[] = [];
    words.forEach((word, wi) => {
      const letters: React.ReactNode[] = [];
      for (let i = 0; i < word.length; i++) {
        const at = idx++;
        letters.push(
          <span
            key={`l${wi}_${i}`}
            ref={(el) => {
              charsRef.current[at] = el;
            }}
            style={{ display: "inline-block", opacity: 0.2, willChange: "opacity" }}
          >
            {word[i]}
          </span>
        );
      }
      nodes.push(
        <span key={`w${wi}`} style={{ whiteSpace: "nowrap" }}>
          {letters}
        </span>
      );
      if (wi < words.length - 1) {
        const at = idx++;
        nodes.push(
          <span
            key={`s${wi}`}
            ref={(el) => {
              charsRef.current[at] = el;
            }}
            style={{ opacity: 0.2 }}
          >
            {" "}
          </span>
        );
      }
    });
    return nodes;
  }, [t.paragraph]);

  // ── scroll driver ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
    const ease = (t2: number) => (t2 < 0.5 ? 2 * t2 * t2 : 1 - Math.pow(-2 * t2 + 2, 2) / 2);

    // cached layout metrics — refreshed on resize only, never on scroll
    let total = 0;
    let rootTop = 0;
    let marqueeStopVw = -300; // where the marquee freezes: last word at the left edge
    // fused-image → Echipa morph: the collage-area rect (viewport px) to grow FROM
    let morphStart = { left: 0, top: 0, width: 0, height: 0 };
    let vw = 0;
    let vh = 0;
    const measure = () => {
      const root = rootRef.current;
      if (!root) return;
      rootTop = root.offsetTop;
      total = root.offsetHeight - window.innerHeight;
      // stop with the phrase's right edge (end of the last word) at the right wall
      const m = marqueeRef.current;
      if (m) marqueeStopVw = 97 - (m.offsetWidth / window.innerWidth) * 100;

      // auto-fit the goal chunk so it ALWAYS fits one viewport height (it fills the
      // column on tall screens and shrinks just enough on wide/short ones); keep the
      // "Scopul nostru" heading matched to the chunk so they read as one sentence
      const ch = chunkRef.current;
      const hd = headingRef.current;
      const H = window.innerHeight;
      if (ch && H > 0) {
        ch.style.fontSize = "clamp(40px, 5.3vw, 104px)"; // re-apply base each measure
        let fs = parseFloat(getComputedStyle(ch).fontSize);
        let h = ch.scrollHeight;
        if (fs > 0 && h > 0) {
          const topPx = H * 0.06; // the chunk sits at top:6%
          const fillH = H - topPx - H * 0.045; // fill down to a ~4.5% bottom margin
          // scale toward filling — GROW on big screens (where the clamp cap under-fills)
          // or SHRINK on short ones. High cap so the paragraph truly FILLS the right
          // half (both height and, via word-wrap, width) instead of leaving dead space.
          fs = Math.min(240, Math.max(24, (fs * fillH) / h));
          ch.style.fontSize = fs + "px";
          h = ch.scrollHeight;
          // grow-to-fill: nudge up while there's still clear headroom under the fill
          // line (word-wrap makes scrollHeight jump in steps, so the single scale above
          // often lands short of the target row-count).
          let grow = 0;
          while (topPx + h < H * 0.955 && fs < 240 && grow < 14) {
            fs *= 1.035;
            ch.style.fontSize = fs + "px";
            h = ch.scrollHeight;
            grow++;
          }
          // guarantee it clears the viewport: a word-wrap row-jump can overshoot, so
          // shrink until the whole block fits under ~97vh
          let guard = 0;
          while (topPx + h > H * 0.97 && fs > 24 && guard < 14) {
            fs *= 0.96;
            ch.style.fontSize = fs + "px";
            h = ch.scrollHeight;
            guard++;
          }
          if (hd) hd.style.fontSize = fs + "px";
        }
      }

      // position the image stack so the whitespace ABOVE it (below the "Scopul
      // nostru" heading) exactly matches the whitespace BELOW it (down to the
      // section's bottom edge). The heading is auto-sized above, so its bottom is
      // measured live rather than guessed.
      const col = collageAreaRef.current;
      const hd2 = headingRef.current;
      if (col && hd2 && H > 0) {
        const headBottom = hd2.offsetTop + hd2.offsetHeight; // px from top of column
        const outerGap = H * 0.045; // equal gap: heading→first image and last image→end
        const top = headBottom + outerGap;
        const height = Math.max(0, H - outerGap - top);
        col.style.top = top + "px";
        col.style.height = height + "px";
        // the collage area sits in the left column (left 4%, width 44% of the viewport);
        // remember its viewport rect so the fused image can grow FROM here to the left half.
        vw = window.innerWidth;
        vh = window.innerHeight;
        morphStart = { left: 0.04 * vw, top, width: 0.44 * vw, height };
      }
    };

    let revealState = "";
    // last opacity written per char, so the reveal loop only touches the DOM for
    // chars whose value actually changed this frame (the moving wave band is a
    // couple dozen chars, not the whole ~230-char paragraph) — this avoids a
    // per-frame style-recalc storm across every span.
    let prevOpac: number[] = [];
    let fusedPlayed = false;
    let lastNavY = window.scrollY;
    let navDir: "up" | "down" = "up";

    const update = () => {
      if (!rootRef.current) return;
      const y = window.scrollY;
      let p = total > 0 ? (y - rootTop) / total : 0;
      p = cl(p);

      // 1. split: panel slides off left (transform), media is full-bleed behind
      const e1 = cl(p / 0.08);
      const panelW = 50 * (1 - e1);
      if (panelRef.current) panelRef.current.style.transform = "translateX(" + (-(e1 * 50)).toFixed(3) + "vw)";
      if (mediaInnerRef.current) {
        // zoomed enough to give pan room; slides the video left→right as you scroll
        const vScale = 1.26 + 0.05 * cl(p / 0.45);
        const vPan = 10 - 20 * cl(p / 0.32);
        mediaInnerRef.current.style.transform =
          "translateX(" + vPan.toFixed(2) + "vw) scale(" + vScale.toFixed(4) + ")";
      }
      // parallax: the goal section rises over the video with an EASED curve. The
      // video + marquee drift UP locked to that SAME eased progress (`gp`), but only
      // ~40% of the section's travel — so they start and move together while the
      // video visibly lags behind = a real 3D depth (fixes the old "video moves
      // first, then the section" desync, which came from a linear video vs an eased
      // section starting at different apparent speeds).
      const goalRise = cl((p - 0.08) / 0.10); // rise p=0.08 → 0.18, then it PINS (gp=1)
      const gp = ease(goalRise); // eased section-rise progress, reused below
      const par = gp * 40;
      if (mediaWrapRef.current)
        mediaWrapRef.current.style.transform = "translateY(-" + par.toFixed(2) + "vh)";
      if (blackGradRef.current) blackGradRef.current.style.opacity = cl((50 - panelW) / 25).toFixed(3);

      // 2. hero title: fade fast + lift with the video; reverse colour over video
      // title exits fast, sliding LEFT with the video (not up).
      // opacity fades 2x faster than the slide (invisible by p=0.025).
      const headSlide = cl(p / 0.05);
      const headFade = cl(p / 0.015);
      if (headRef.current) {
        headRef.current.style.opacity = (1 - headFade).toFixed(3);
        headRef.current.style.transform = "translateX(" + (-(headSlide * 12)).toFixed(2) + "vw)";
      }
      if (p < 0.12) {
        const D = headSlide * 12; // keep the colour split aligned to the panel edge while it slides
        if (headDarkRef.current)
          headDarkRef.current.style.clipPath = "inset(0 " + (100 - panelW - D).toFixed(3) + "% 0 0)";
        if (headLightRef.current)
          headLightRef.current.style.clipPath = "inset(0 0 0 " + (panelW + D).toFixed(3) + "%)";
      }
      if (designingRef.current) designingRef.current.style.opacity = (1 - cl(p / 0.015)).toFixed(3);
      if (scrimRef.current) scrimRef.current.style.opacity = (0.3 + 0.24 * cl(p / 0.25)).toFixed(3);

      // 3. header: hide on scroll-down, show on scroll-up
      const dy = y - lastNavY;
      if (Math.abs(dy) > 3) {
        navDir = dy > 0 ? "down" : "up";
        lastNavY = y;
      }
      if (navRef.current)
        navRef.current.style.transform = navDir === "down" && y > 80 ? "translateY(-135%)" : "translateY(0)";

      // 4. marquee: full opacity, one phrase, R→L, starts once title is gone
      if (marqueeRef.current) {
        // sweeps in slowly, then STOPS with the last word at the left edge (~p=0.21) and
        // holds there while the goal panel rises up from the bottom and wipes it away
        const mS = cl(p / 0.08);
        const x = 110 + (marqueeStopVw - 110) * mS;
        marqueeRef.current.style.transform =
          "translate(" + x.toFixed(2) + "vw, -50%) translateY(-" + par.toFixed(2) + "vh)";
        // fade out fast the instant it stops so it doesn't linger over the rising goal
        marqueeRef.current.style.opacity = (1 - cl((p - 0.09) / 0.05)).toFixed(3);
      }

      // 5. the WHOLE goal section (title + collage + chunk) rises up from the bottom
      //    the instant the marquee stops, locked to the video parallax. Once fully
      //    risen (~p=0.32) gp clamps to 1, so it PINS in place — held there while the
      //    chunk reveals and the images fuse. It then scrolls away naturally when the
      //    sticky scrub container ends (the default hand-off into the team section).
      if (goalRef.current) {
        goalRef.current.style.transform = "translateY(" + ((1 - gp) * 100).toFixed(3) + "%)";
      }

      // 6. chunk reveal: begins the moment the FIRST ROW becomes visible (partway
      //    through the rise, ~p=0.13) — not when the whole chunk is up — then darkens
      //    the paragraph grey→ink in READING ORDER (soft left→right, top→bottom,
      //    mid-word) as the user keeps scrolling, finishing while the section is pinned.
      const rp = cl((p - 0.13) / 0.57); // reveal scrubs p=0.13 → 0.70
      const chars = charsRef.current;
      const N = chars.length;
      if (N) {
        if (forceRevealRef.current) {
          revealState = "";
          forceRevealRef.current = false;
          prevOpac = []; // spans were recreated (lang switch) — drop the stale cache
        }
        // (re)build the per-char cache whenever it's empty or the length changed
        if (prevOpac.length !== N) prevOpac = new Array(N).fill(-1);
        // write a char's opacity only when it actually moved (>1 unit at 3-dp)
        const setOpac = (i: number, v: number) => {
          if (Math.abs(v - prevOpac[i]) < 0.001) return;
          const el = chars[i];
          if (el) el.style.opacity = v.toFixed(3);
          prevOpac[i] = v;
        };
        if (p <= 0.13) {
          if (revealState !== "before") {
            for (let i = 0; i < N; i++) setOpac(i, 0.2);
            revealState = "before";
          }
        } else if (p >= 0.70) {
          if (revealState !== "after") {
            for (let i = 0; i < N; i++) setOpac(i, 1);
            revealState = "after";
          }
        } else {
          revealState = "during";
          const spread = Math.max(16, N * 0.12); // width of the soft reveal wave
          const lit = rp * (N + spread);
          for (let i = 0; i < N; i++) {
            let o = (lit - i) / spread;
            o = o < 0 ? 0 : o > 1 ? 1 : o;
            setOpac(i, 0.2 + 0.8 * o);
          }
        }
      }

      // collage: each image POPS in (2s zoom 1.2→1.0) as its cue passes while the
      // section rises, stacking over the ones before it — a time-based pop
      const imgs = imgsRef.current;
      const shown = imgShownRef.current;
      for (let k = 0; k < imgs.length; k++) {
        const el = imgs[k];
        if (!el) continue;
        const trig = 0.1 + k * 0.02;
        if (p >= trig) {
          if (!shown[k]) {
            shown[k] = true;
            el.style.animation = "none";
            void el.offsetWidth; // reflow so the pop restarts cleanly
            el.style.animation = "cd-pop 2s cubic-bezier(0.16,0.9,0.3,1) both";
          }
        } else if (shown[k]) {
          shown[k] = false;
          el.style.animation = "none";
          el.style.opacity = "0";
          el.style.transform = "scale(1.2)";
        }
      }

      // 7. FUSE: after the reveal lands, the 4 blocks fuse into ONE image via a
      //    top→bottom FILL wipe. It's TIME-based: the instant the scroll passes the
      //    trigger, the single image reveals itself downward over the stack (~0.9s CSS
      //    transition on clip-path), it is NOT scrubbed frame-by-frame. Scrolling back
      //    above the trigger resets it so it can play again.
      const f = fusedRef.current;
      if (f) {
        // hysteresis: fire once at 0.78, only re-arm well below (0.55) so scroll
        // jitter around the trigger can't restart the fill mid-animation.
        if (p >= 0.78) {
          if (!fusedPlayed) {
            fusedPlayed = true;
            f.style.clipPath = "inset(0 0 0 0)"; // fill down → whole image shown
          }
        } else if (p < 0.55 && fusedPlayed) {
          fusedPlayed = false;
          f.style.clipPath = "inset(0 0 100% 0)"; // clipped back to nothing
        }
      }

      // 8. MORPH: after the fill, the fused image grows from the collage area to the
      //    LEFT HALF of the viewport — the exact spot where Echipa's Dr. 1 photo sits,
      //    so as this sticky releases the image reads straight into the team section.
      const m = morphRef.current;
      if (m) {
        if (p >= 0.85 && morphStart.width > 0) {
          const mp = ease(cl((p - 0.85) / 0.15)); // grow p=0.85 → 1.0
          m.style.opacity = "1";
          m.style.left = (morphStart.left * (1 - mp)).toFixed(1) + "px";
          m.style.top = (morphStart.top * (1 - mp)).toFixed(1) + "px";
          m.style.width = (morphStart.width + (vw * 0.5 - morphStart.width) * mp).toFixed(1) + "px";
          m.style.height = (morphStart.height + (vh - morphStart.height) * mp).toFixed(1) + "px";
        } else {
          m.style.opacity = "0";
        }
      }
    };
    updateRef.current = update;
    measureRef.current = measure;

    const prevBodyBg = document.body.style.background;
    document.body.style.background = panelColor;

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
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    update();
    const t1 = setTimeout(() => {
      measure();
      update();
    }, 120);
    const t2 = setTimeout(() => {
      measure();
      update();
    }, 480);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.background = prevBodyBg;
    };
  }, [marqueeTravel, panelColor]);

  // re-apply scroll-driven styles after a language change re-renders the DOM
  useEffect(() => {
    imgShownRef.current = []; // re-arm the collage pops for the re-rendered nodes
    forceRevealRef.current = true; // re-apply the reveal to the new char spans
    measureRef.current();
    updateRef.current();
  }, [lang]);

  const navRowText = { display: "flex", alignItems: "center" } as const;

  return (
    <>
    <div ref={rootRef} style={{ position: "relative", height: `${scrubHeight}vh`, background: panelColor }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: panelColor,
        }}
      >
        {/* ── media (full-bleed, behind the sliding panel) ── */}
        <div
          ref={mediaWrapRef}
          style={{ position: "absolute", inset: 0, overflow: "hidden", background: MEDIA_BG, zIndex: 1, willChange: "transform" }}
        >
          <div
            ref={mediaInnerRef}
            style={{
              position: "absolute",
              inset: 0,
              transform: "translateX(10vw) scale(1.26)",
              transformOrigin: "center center",
              willChange: "transform",
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- decorative background video */}
            <video
              src="/hero.webm"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          <div
            ref={blackGradRef}
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.22) 40%, rgba(0,0,0,0) 68%)",
              opacity: 0,
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "26%",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.28), rgba(0,0,0,0))",
              pointerEvents: "none",
              zIndex: 3,
            }}
          />
          <div
            ref={scrimRef}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "52%",
              background: "linear-gradient(to top, rgba(9,22,28,0.62), rgba(9,22,28,0))",
              pointerEvents: "none",
              opacity: 0.32,
              zIndex: 3,
            }}
          />
        </div>

        {/* ── left panel (slides off with transform) ── */}
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "50vw",
            background: panelColor,
            zIndex: 3,
            transform: "translateX(0)",
            willChange: "transform",
          }}
        />

        {/* ── marquee ── */}
        <div
          ref={marqueeRef}
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            whiteSpace: "nowrap",
            transform: "translate(110vw, -50%)",
            opacity: 0,
            zIndex: 2,
            pointerEvents: "none",
            fontFamily: serifFont,
            fontWeight: 400,
            fontSize: "clamp(54px, 9.5vw, 165px)",
            lineHeight: 1,
            color: LIGHT,
            letterSpacing: "-0.015em",
            willChange: "transform,opacity",
          }}
        >
          {marqueeHead}{" "}
          <span ref={marqueeLastRef}>{marqueeLast}</span>
        </div>

        {/* ── hero heading (two clipped colour layers → reversed over video) ── */}
        <div
          ref={headRef}
          style={{ position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none", willChange: "opacity,transform" }}
        >
          <div ref={headDarkRef} style={{ position: "absolute", inset: 0, clipPath: "inset(0 50% 0 0)" }}>
            <HeroTitle hero={t.hero} color={INK} serif={serifFont} />
          </div>
          <div ref={headLightRef} style={{ position: "absolute", inset: 0, clipPath: "inset(0 0 0 50%)" }}>
            <HeroTitle hero={t.hero} color={LIGHT} serif={serifFont} />
          </div>
        </div>

        {/* ── designing caption ── */}
        <div
          ref={designingRef}
          style={{
            position: "absolute",
            left: "52%",
            bottom: "26px",
            zIndex: 6,
            fontFamily: serifFont,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(22px, 2.3vw, 37px)",
            lineHeight: 0.95,
            color: LIGHT,
            pointerEvents: "none",
            textShadow: "0 1px 22px rgba(0,0,0,0.42)",
          }}
        >
          {/* whole caption in Instrument Serif; first line upright, the rest italic */}
          <span style={{ fontStyle: "normal" }}>{t.caption[0]}</span>
          <br />
          {t.caption[1]}
        </div>

        {/* ── nav (auto-hiding header) ── */}
        <div
          ref={navRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 8,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "26px 40px",
            transform: "translateY(0)",
            transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
            willChange: "transform",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- brand logo SVG */}
            <img
              src="/caracas-logo.svg"
              alt="Caracaș Dental"
              style={{ height: "44px", width: "auto", display: "block" }}
            />
            <div style={{ ...navRowText, gap: "8px", fontSize: "15px", fontWeight: 700, color: INK }}>
              {t.nav.menu}
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                <path d="M1 2h16M1 6h16M1 10h16" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ ...navRowText, gap: "6px", fontSize: "15px", fontWeight: 700, color: INK }}>
              {t.nav.services}
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path
                  d="M1 1.5L6 6.5L11 1.5"
                  stroke={INK}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "26px" }}>
            <div
              style={{
                ...navRowText,
                gap: "5px",
                fontSize: "14px",
                fontWeight: 700,
                color: LIGHT,
                textShadow: "0 1px 16px rgba(0,0,0,0.4)",
              }}
            >
              {t.nav.patientForm}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 9L9 3M9 3H4M9 3V8"
                  stroke={LIGHT}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ textAlign: "right", textShadow: "0 1px 16px rgba(0,0,0,0.4)" }}>
              <div style={{ ...navRowText, gap: "6px", fontSize: "14px", fontWeight: 800, color: LIGHT }}>
                068 344 333
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", letterSpacing: "0.02em", marginTop: "1px" }}>
                {t.nav.city}
              </div>
            </div>
            {/* RO / RU toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                background: "rgba(255,255,255,0.14)",
                borderRadius: "999px",
                padding: "3px",
                backdropFilter: "blur(6px)",
              }}
            >
              {(["ro", "ru"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    appearance: "none",
                    border: 0,
                    cursor: "pointer",
                    borderRadius: "999px",
                    padding: "5px 11px",
                    fontFamily: FONT,
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "0.03em",
                    color: lang === l ? "#fff" : "rgba(255,255,255,0.75)",
                    background: lang === l ? CORAL : "transparent",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── goal panel ── */}
        <div
          ref={goalRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            background: panelColor,
            borderTop: "1px solid rgba(28,43,48,0.14)",
            transform: "translateY(100%)",
            display: "flex",
            flexDirection: "column",
            willChange: "transform,opacity",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* ── LEFT HALF: big "Scopul nostru" + a mixed-orientation collage ── */}
            <div style={{ position: "absolute", left: "4%", top: 0, width: "44%", height: "100%" }}>
              <div
                ref={headingRef}
                style={{
                  position: "absolute",
                  left: 0,
                  top: "6%",
                  fontFamily: serifFont,
                  fontWeight: 400,
                  fontSize: "clamp(40px, 5.3vw, 104px)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.02em",
                  color: INK,
                }}
              >
                {t.goalTitle}
              </div>
              {/* Image area (position/height auto-balanced in measure). Holds two
                  cross-fading layers: the 4-block stack, and the single fused image. */}
              <div
                ref={collageAreaRef}
                style={{ position: "absolute", left: 0, top: "24%", width: "100%", height: "72%" }}
              >
                {/* 4 equal HORIZONTAL (landscape) blocks stacked vertically, even gaps.
                    Each pops in top→bottom, one-by-one, as you scroll. */}
                <div
                  ref={collageRef}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    willChange: "opacity",
                  }}
                >
                  {[0, 1, 2, 3].map((k) => (
                    <div
                      key={k}
                      ref={(el) => {
                        imgsRef.current[k] = el;
                      }}
                      style={{
                        flex: "1 1 0",
                        width: "100%",
                        overflow: "hidden",
                        background: "#dbe3e3",
                        opacity: 0,
                        transform: "scale(1.2)",
                        pointerEvents: "none",
                        willChange: "transform, opacity",
                      }}
                    >
                      <ImageSlot bg="#dbe3e3" label={t.collage(k + 1)} />
                    </div>
                  ))}
                </div>
                {/* the single fused image — revealed by a top→bottom FILL wipe over the
                    stack (clip-path animates on a timer when scroll reaches the trigger).
                    It is Dr. 1's photo, so it can grow straight into the Echipa section. */}
                <div
                  ref={fusedRef}
                  style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    background: "#141418",
                    clipPath: "inset(0 0 100% 0)",
                    transition: "clip-path 0.9s cubic-bezier(0.7,0,0.25,1)",
                    pointerEvents: "none",
                    willChange: "clip-path",
                  }}
                >
                  <ImageSlot bg="#141418" dark label={t.doctors[0].name.join(" ")} />
                </div>
              </div>
            </div>

            {/* ── RIGHT HALF: the big chunk fills the column; reveals in reading order ── */}
            <div style={{ position: "absolute", left: "51%", top: 0, width: "47%", height: "100%" }}>
              <div
                ref={chunkRef}
                style={{
                  position: "absolute",
                  left: 0,
                  top: "6%",
                  width: "100%",
                  fontFamily: serifFont,
                  fontWeight: 400,
                  fontSize: "clamp(40px, 5.3vw, 104px)",
                  lineHeight: 1.06,
                  letterSpacing: "-0.02em",
                  color: INK,
                }}
              >
                {paragraphNodes}
              </div>
            </div>
          </div>
        </div>

        {/* fused image grows from the collage area to the LEFT HALF → Echipa Dr. 1 */}
        <div
          ref={morphRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "44vw",
            height: "40vh",
            overflow: "hidden",
            background: "#141418",
            opacity: 0,
            zIndex: 21,
            pointerEvents: "none",
            willChange: "left, top, width, height, opacity",
          }}
        >
          <ImageSlot bg="#141418" dark label={t.doctors[0].name.join(" ")} />
        </div>

      </div>
    </div>

    {/* ── ECHIPA NOASTRĂ — normal-flow black carousel; fused image reads into Dr. 1 ── */}
    <EchipaSection doctors={t.doctors} team={t.team} book={t.book} serif={serifFont} />

    {/* ── REZULTATE / portfolio — tall image + two split columns, block mirrored ── */}
    <section
      style={{
        background: BG,
        padding: "clamp(70px,9vh,140px) 5% clamp(90px,12vh,150px)",
      }}
    >
      <h2
        style={{
          fontFamily: serifFont,
          fontWeight: 400,
          fontSize: "clamp(34px,4.6vw,84px)",
          lineHeight: 1.02,
          letterSpacing: "-0.02em",
          color: INK,
          margin: "0 0 clamp(36px,5vh,64px)",
          maxWidth: "16ch",
        }}
      >
        {t.results.title}
      </h2>

      <div style={{ display: "grid", gap: "clamp(10px,1vw,18px)" }}>
        <ResultsBlock tiles={t.results.tiles.slice(0, 5)} />
        <ResultsBlock tiles={t.results.tiles.slice(5, 10)} reversed />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(36px,5vh,64px)" }}>
        <button
          style={{
            appearance: "none",
            border: 0,
            cursor: "pointer",
            background: INK,
            color: "#fff",
            fontFamily: FONT,
            fontSize: "15px",
            fontWeight: 800,
            letterSpacing: "0.01em",
            borderRadius: "999px",
            padding: "18px 42px",
          }}
        >
          {t.results.more}
        </button>
      </div>
    </section>

    {/* ── CE OFERIM — pinned "what we offer" scroll-through of services ── */}
    <ServicesSection title={t.services.title} intro={t.services.intro} steps={t.services.steps} serif={serifFont} />

    {/* ── PREFOOTER image + animated FOOTER (rises over it, circular top) ── */}
    <SiteFooter footer={t.footer} book={t.book} serif={serifFont} />
    </>
  );
}
