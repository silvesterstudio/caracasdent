"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import ImageSlot from "./ImageSlot";
import EchipaSection from "./EchipaSection";
import ServicesSection from "./ServicesSection";
import ConsultationTimeline from "./ConsultationTimeline";
import FaqSection from "./FaqSection";
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

// The hero uses exactly TWO typefaces, nothing else:
//   • Nunito       — all UI / body / labels (FONT)
//   • Instrument Serif — every display headline (SERIF)
// (Instrument Serif is Latin-only, so RU Cyrillic falls back to a generic serif;
//  we intentionally do NOT introduce Georgia as a third face.)
const FONT = "var(--font-nunito), 'Nunito', system-ui, sans-serif";
const SERIF = "var(--font-instrument), 'Instrument Serif', serif";

// Brand palette — kept deliberately tight: dark ink, white, one light neutral,
// and a single coral accent. No other colours in the hero.
const BG = "#ffffff"; // sections after the team are pure white, matching the header/hero
const INK = "#1c2b30";
const LIGHT = "#ffffff";
const ACCENT = "#eb7180";
const MEDIA_BG = "#c9d2d2";

// ── stock doctor photos (Unsplash CDN, hotlinked) — placeholders to preview the idea live.
//    Swap these for the clinic's real photography later; the layout is identical either way.
const U = (id: string, w: number, h: number, faces = false) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}&h=${h}${faces ? "&crop=faces" : ""}`;
const DOCTOR_PHOTOS = [
  U("1674775372058-c4c8813c6611", 1000, 1300, true), // Dr. Ion Caracaș
  U("1670191247079-f9713ae06dcf", 1000, 1300, true), // Dr. Elena Caracaș
  U("1667133295308-9ef24f71952e", 1000, 1300, true), // Dr. Nicolae Caracaș
];
const DOCTOR_CANDIDS = [
  U("1663151064065-cb334788f77d", 700, 900),
  U("1662837775286-7e6258c7c595", 700, 900),
  U("1663185551550-f8f56529ac5e", 700, 900),
];
const CLINIC_IMAGES = [
  U("1588776813941-dcf9c55e84d2", 900, 520),
  U("1662837775272-545d8e143ad0", 900, 520),
  U("1663185551550-f8f56529ac5e", 900, 520),
  U("1683349370055-7eba66a404c6", 900, 520),
];
// ── "after" result photos: bright, clean, repaired smiles for the Rezultate portfolio.
const RESULT_IMAGES = [
  U("1489278353717-f64c6ee8a4d2", 900, 1000, true),
  U("1567516364473-233c4b6fcfbe", 900, 1000, true),
  U("1677026010083-78ec7f1b84ed", 900, 1000, true),
  U("1611166819595-ac34987dfa57", 900, 1000, true),
  U("1675526607070-f5cbd71dde92", 900, 1000, true),
  U("1769559893692-c6d0623bf8e4", 900, 1000, true),
  U("1654373535457-383a0a4d00f9", 900, 1000, true),
  U("1680049113650-4a1c24f61d71", 900, 1000, true),
  U("1548382131-e0ebb1f0cdea", 900, 1000, true),
  U("1499313843378-eebdb187f629", 900, 1000, true),
];

type Doctor = {
  name: [string, string];
  spec: string;
  bio: string;
  services: [string, string, string, string];
};
type Copy = {
  nav: { menu: string; services: string; patientForm: string; city: string; contact: string; basedIn: string };
  hero: {
    l1: string;
    l2: string;
    accent: string;
    pill: string;
    sub: string;
    mission: string;
    stats: [{ v: string; l: string }, { v: string; l: string }, { v: string; l: string }];
    chosenBy: string;
  };
  marquee: string;
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
  process: { eyebrow: string; title: string; label: string; steps: { name: string; desc: string }[]; cta: string };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
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
    nav: { menu: "Meniu", services: "Servicii", patientForm: "Formular pacient", city: "Chișinău", contact: "Contactează-ne", basedIn: "Ne găsești în" },
    hero: {
      l1: "Dinții tăi,",
      l2: "Misiunea",
      accent: "noastră",
      pill: "Fiecare zâmbet spune o poveste",
      sub: "Grijă și încredere pentru fiecare generație — tehnici avansate și tratamente personalizate, într-un loc unde te simți valoros.",
      mission: "Implantologie, estetică și terapie — îngrijire completă, de la prima consultație până la zâmbetul de care ești mândru.",
      stats: [
        { v: "25+", l: "Ani de experiență" },
        { v: "3", l: "Locații în Chișinău" },
        { v: "5.0", l: "Rating pacienți" },
      ],
      chosenBy: "Îngrijiți de familia Caracaș",
    },
    marquee: "Zâmbetul ca limbaj de comunicare",
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
          name: "Ortodonție",
          desc: "Aliniem dinții cu aparate fixe și gutiere transparente — pentru o mușcătură corectă și un zâmbet drept, la orice vârstă.",
          points: ["Aparat dentar fix", "Gutiere transparente", "Aparat ceramic", "Contenție"],
        },
        {
          name: "Terapie",
          desc: "Îngrijire completă care păstrează dinții sănătoși, funcționali și frumoși pe termen lung.",
          points: ["Tratament de canal", "Obturații estetice", "Coroane & punți", "Parodontologie"],
        },
        {
          name: "Estetică dentară",
          desc: "Transformăm zâmbetul cu tehnici minim invazive, pentru un rezultat natural și luminos.",
          points: ["Fațete ceramice", "Albire profesională", "Bonding estetic", "Digital Smile Design"],
        },
      ],
    },
    process: {
      eyebrow: "— 05",
      title: "Drumul tău",
      label: "(în 3 pași)",
      steps: [
        {
          name: "Programare",
          desc: "Alege o oră care ți se potrivește și rezervă-ți locul printr-un singur mesaj. Fără costuri, fără obligații — doar primul pas.",
        },
        {
          name: "Consultație gratuită",
          desc: "Te examinăm cu atenție, îți ascultăm dorințele și îți răspundem la toate întrebările. Pleci acasă cu o imagine clară asupra zâmbetului tău.",
        },
        {
          name: "Plan personalizat",
          desc: "Îți construim un plan de tratament pe măsură, cu etape și costuri transparente — ca să pornești la drum cu deplină încredere.",
        },
      ],
      cta: "Programează consultația gratuită",
    },
    faq: {
      eyebrow: "Întrebări frecvente",
      title: "Bine de știut",
      items: [
        {
          q: "Cât costă prima consultație?",
          a: "Prima consultație este gratuită. Te examinăm cu atenție, discutăm opțiunile și pleci cu un plan de tratament clar — fără costuri și fără nicio obligație.",
        },
        {
          q: "Tratamentul este dureros?",
          a: "Lucrăm cu anestezie modernă și tehnici minim invazive, astfel încât intervențiile să fie cât mai confortabile. Grija pentru confortul tău este mereu pe primul loc.",
        },
        {
          q: "Cât durează un tratament cu implant dentar?",
          a: "Depinde de fiecare caz, însă în general procesul durează între 2 și 6 luni, de la inserarea implantului până la coroana finală. Îți explicăm fiecare etapă încă de la prima consultație.",
        },
        {
          q: "Pot achita tratamentul în rate?",
          a: "Da. Oferim planuri de plată flexibile, adaptate fiecărui tratament, ca să te poți concentra pe zâmbetul tău, nu pe buget.",
        },
        {
          q: "Cum mă pot programa?",
          a: "Ne poți scrie printr-un singur mesaj sau ne suni direct. Alegi o oră care ți se potrivește, iar noi ne ocupăm de tot restul.",
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
    nav: { menu: "Меню", services: "Услуги", patientForm: "Анкета пациента", city: "Кишинёв", contact: "Свяжитесь с нами", basedIn: "Мы находимся в" },
    hero: {
      l1: "Ваши зубы,",
      l2: "наша",
      accent: "цель",
      pill: "Каждая улыбка — это история",
      sub: "Забота и доверие для каждого поколения — передовые методики и индивидуальные решения там, где вы чувствуете себя ценным.",
      mission: "Имплантология, эстетика и терапия — полный уход, от первой консультации до улыбки, которой вы гордитесь.",
      stats: [
        { v: "25+", l: "Лет опыта" },
        { v: "3", l: "Локации в Кишинёве" },
        { v: "5.0", l: "Рейтинг пациентов" },
      ],
      chosenBy: "О вас заботится семья Каракаш",
    },
    marquee: "Улыбка — язык общения",
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
          name: "Ортодонтия",
          desc: "Выравниваем зубы брекетами и прозрачными капами — ради правильного прикуса и ровной улыбки в любом возрасте.",
          points: ["Брекет-системы", "Прозрачные капы", "Керамические брекеты", "Ретенция"],
        },
        {
          name: "Терапия",
          desc: "Комплексный уход, сохраняющий зубы здоровыми, функциональными и красивыми надолго.",
          points: ["Лечение каналов", "Эстетические пломбы", "Коронки и мосты", "Пародонтология"],
        },
        {
          name: "Эстетическая стоматология",
          desc: "Преображаем улыбку минимально инвазивными методами — ради естественного и сияющего результата.",
          points: ["Керамические виниры", "Профессиональное отбеливание", "Эстетический бондинг", "Digital Smile Design"],
        },
      ],
    },
    process: {
      eyebrow: "— 05",
      title: "Ваш путь",
      label: "(в 3 шага)",
      steps: [
        {
          name: "Запись",
          desc: "Выберите удобное время и займите место одним сообщением. Без затрат и обязательств — просто первый шаг.",
        },
        {
          name: "Бесплатная консультация",
          desc: "Мы внимательно осматриваем, выслушиваем ваши пожелания и отвечаем на все вопросы. Вы уходите с ясным представлением о своей улыбке.",
        },
        {
          name: "Индивидуальный план",
          desc: "Составляем план лечения с прозрачными этапами и стоимостью — чтобы вы начали с полной уверенностью.",
        },
      ],
      cta: "Записаться на консультацию",
    },
    faq: {
      eyebrow: "Частые вопросы",
      title: "Полезно знать",
      items: [
        {
          q: "Сколько стоит первая консультация?",
          a: "Первая консультация бесплатна. Мы внимательно осматриваем, обсуждаем варианты, и вы уходите с понятным планом лечения — без затрат и обязательств.",
        },
        {
          q: "Лечение болезненное?",
          a: "Мы используем современную анестезию и минимально инвазивные методики, чтобы процедуры были максимально комфортными. Ваш комфорт всегда на первом месте.",
        },
        {
          q: "Сколько длится лечение с имплантом?",
          a: "Зависит от случая, но в среднем процесс занимает от 2 до 6 месяцев — от установки импланта до финальной коронки. Мы объясняем каждый этап уже на первой консультации.",
        },
        {
          q: "Можно ли оплатить лечение в рассрочку?",
          a: "Да. Мы предлагаем гибкие планы оплаты под каждое лечение, чтобы вы могли думать о своей улыбке, а не о бюджете.",
        },
        {
          q: "Как записаться?",
          a: "Напишите нам одним сообщением или позвоните напрямую. Вы выбираете удобное время, а всё остальное мы берём на себя.",
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

function ResTile({ tags, area, src }: { tags: string[]; area: string; src?: string }) {
  return (
    <div style={{ gridArea: area, position: "relative", overflow: "hidden", background: "#dfe6e6" }}>
      <ImageSlot bg="#dfe6e6" src={src} label={tags[0]} />
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

function ResultsBlock({ tiles, images = [], reversed = false }: { tiles: string[][]; images?: string[]; reversed?: boolean }) {
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
      <ResTile tags={tiles[0]} area="big" src={images[0]} />
      <ResTile tags={tiles[1]} area="a" src={images[1]} />
      <ResTile tags={tiles[2]} area="b" src={images[2]} />
      <ResTile tags={tiles[3]} area="c" src={images[3]} />
      <ResTile tags={tiles[4]} area="d" src={images[4]} />
    </div>
  );
}

export type CaracasHeroProps = {
  scrubHeight?: number;
  marqueeTravel?: number;
  panelColor?: string;
};

export default function CaracasHero({
  // scrubHeight is the hero's total scroll length (in vh). The whole landing + "Scopul nostru"
  // choreography is mapped across it, so a LARGER value spreads every phase over more scroll —
  // each gesture moves the animation less, which reads as slower + smoother (closer to the
  // natural-flow feel of the Rezultate section the user liked). 300 → 420 for a gentler scrub,
  // then 420 → 240 to cut the long DEAD scroll after the fuse (fuse finishes ~p0.19; this
  // shortens the whole hero from 4.2 → 2.4 screens so the Echipa hand-off comes much sooner).
  scrubHeight = 240,
  marqueeTravel = 430,
  // white, matching the left panel — so the framed video card's surround reads as the same
  // sheet as the panel (no #f4f6f6 vs #fff seam around the card).
  panelColor = LIGHT,
}: CaracasHeroProps) {
  const [lang, setLang] = useState<"ro" | "ru">("ro");
  const t = COPY[lang];
  const marqueeWords = t.marquee.split(" ");
  const marqueeLast = marqueeWords[marqueeWords.length - 1];
  const marqueeHead = marqueeWords.slice(0, -1).join(" ");
  const serifFont = SERIF;

  // ── refs ─────────────────────────────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const mediaInnerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const blackGradRef = useRef<HTMLDivElement>(null);
  // all video-side hero UI (mission text top-left + stat cards bottom-right) fades
  // as one unit while the video takes over the full screen
  const videoUiRef = useRef<HTMLDivElement>(null);
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
  // Echipa's Dr. 1 image element, forwarded down so the Scopul scroll driver can pin &
  // grow it across the section hand-off, then release it as the carousel base (see the
  // ECHIPA HAND-OFF block in update()).
  const echDr1Ref = useRef<HTMLDivElement>(null);
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
    // fused-image start rect (collage area, viewport px) — the Scopul fuse's START, and the
    // rect the Dr. 1 image grows FROM during the hand-off.
    let morphStart = { left: 0, top: 0, width: 0, height: 0 };
    // …and the rect it grows TO: the Echipa Dr. 1 container, MEASURED live (not a 50vw guess).
    // Scopul's sticky is 100vw (incl. scrollbar) but Echipa uses the layout width; measuring
    // the real container keeps the image the exact same size when it locks (no size pop).
    let lockTarget = { w: 0, h: 0 };
    let vw = 0;
    let vh = 0;
    // scrollbar width (innerWidth includes it, but the visible viewport / clientWidth does not).
    // The video card's insets are in vw, so without this the RIGHT gap would be scrollbar-px
    // narrower than the LEFT gap. We add it back to the right inset to keep the gaps symmetric.
    let sbw = 0;
    // row-synced reveal: which visual row each paragraph char is in, and the scroll
    // point at which each row's top enters the viewport (so a row finishes revealing
    // exactly as the next row appears below it).
    let rowOf: number[] = [];
    let rowStartChar: number[] = [];
    let rowLen: number[] = [];
    let pVis: number[] = [];
    let pVisEnd = 0.22;
    let numRows = 0;
    const measure = () => {
      const root = rootRef.current;
      if (!root) return;
      rootTop = root.offsetTop;
      total = root.offsetHeight - window.innerHeight;
      sbw = window.innerWidth - document.documentElement.clientWidth;
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
          const topPx = H * 0.13; // the chunk sits at top:13% — clears the fixed header
          const fillH = H - topPx - H * 0.045; // fill down to a ~4.5% bottom margin
          fs = Math.min(240, Math.max(24, (fs * fillH) / h));
          ch.style.fontSize = fs + "px";
          h = ch.scrollHeight;
          let grow = 0;
          while (topPx + h < H * 0.955 && fs < 240 && grow < 14) {
            fs *= 1.035;
            ch.style.fontSize = fs + "px";
            h = ch.scrollHeight;
            grow++;
          }
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

      // ── group the paragraph chars into visual ROWS (by vertical offset) and work out
      //    the scroll point at which each row's top enters the viewport, so the reveal
      //    can pace each row to FINISH exactly as the next row rises into view below. ──
      const chs = charsRef.current;
      if (chs.length && H > 0) {
        rowOf = new Array(chs.length).fill(0);
        rowStartChar = [];
        const rowTops: number[] = [];
        let curTop: number | null = null;
        for (let i = 0; i < chs.length; i++) {
          const el = chs[i];
          if (!el) {
            rowOf[i] = Math.max(0, rowStartChar.length - 1);
            continue;
          }
          const ot = el.offsetTop;
          if (curTop === null || ot > curTop + 6) {
            rowStartChar.push(i);
            rowTops.push(ot);
            curTop = ot;
          }
          rowOf[i] = rowStartChar.length - 1;
        }
        numRows = rowStartChar.length;
        rowLen = [];
        for (let k = 0; k < numRows; k++) {
          rowLen[k] = ((k + 1 < numRows) ? rowStartChar[k + 1] : chs.length) - rowStartChar[k];
        }
        // invert the rise easing (goalRise = ease((p-0.08)/0.30)) to find the p where a
        // given rise-progress gp is reached.
        const easeInv = (e: number) =>
          e <= 0 ? 0 : e >= 1 ? 1 : e < 0.5 ? Math.sqrt(e / 2) : 1 - Math.sqrt(2 * (1 - e)) / 2;
        // one row height (px), to key off a row being FULLY in view (its bottom edge
        // entered) rather than just its top peeking at the very bottom.
        const rowH = numRows > 1 ? rowTops[1] - rowTops[0] : H * 0.12;
        pVis = [];
        for (let k = 0; k < numRows; k++) {
          // chunk sits at top:11% of the panel(=viewport); a row's BOTTOM is at panel-y =
          // 0.11*H + rowTops[k] + rowH; it clears the viewport bottom (row fully visible)
          // when translateY = (1-gp)*H drops to H − that, i.e. gp = 0.11 + (rowTops[k]+rowH)/H.
          const gpVis = 0.13 + (rowTops[k] + rowH) / H;
          pVis[k] = 0.08 + easeInv(Math.min(1, gpVis)) * 0.3;
        }
        const lastWin = numRows > 1 ? pVis[numRows - 1] - pVis[numRows - 2] : 0.03;
        pVisEnd = numRows > 0 ? pVis[numRows - 1] + Math.max(0.02, lastWin) : 0.22;
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

      // measure the Echipa Dr. 1 container (the left-half slot) so the hand-off grows the
      // image to its EXACT pinned size. offsetWidth/Height read fine even below the fold.
      const lc = echDr1Ref.current?.parentElement;
      lockTarget = lc ? { w: lc.offsetWidth, h: lc.offsetHeight } : { w: window.innerWidth * 0.5, h: window.innerHeight };
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

      // 1. HEADER + VIDEO. The hero is now a full-screen video (no split panel, no marquee) with
      //    the hero text/button overlaid; only the goal (Scopul) section still rises over it.
      // header: transparent over the video (all-white ink) at the hero top, then a solid white
      //    bar with dark ink once the light content has risen behind it. No fade.
      if (navRef.current) {
        // transparent the WHOLE time the video is behind the header (the whole first scroll,
        // including while the bar slides up to hide) — only white once Scopul has covered it.
        const overVideo = p < 0.36;
        navRef.current.style.background = overVideo ? "transparent" : "#ffffff";
        navRef.current.style.setProperty("--nav-fg", overVideo ? "rgb(255,255,255)" : "rgb(28,43,48)");
        navRef.current.style.setProperty("--nav-fg-left", overVideo ? "rgba(255,255,255,0.92)" : "rgba(28,43,48,0.72)");
        navRef.current.style.setProperty("--logo-filter", overVideo ? "brightness(0) invert(1)" : "none");
        // Contact button: white pill over the video (all header elements white there); coral
        // primary pill on the white bar.
        navRef.current.style.setProperty("--btn-bg", overVideo ? "#ffffff" : ACCENT);
        navRef.current.style.setProperty("--btn-fg", overVideo ? "rgb(28,43,48)" : "#ffffff");
      }
      // The video does NOT pan horizontally (removed). It only drifts UP as the Scopul section
      // rises over it on an eased curve; the hero text drifts up too but SLOWER (0.45×) so it
      // lags behind = depth. The reveal/rise window is widened to 0.30 so it plays over ~2× the
      // scroll — the letter-by-letter reveal no longer races (and pushing the fuse later keeps
      // the dead scroll before the hand-off small).
      const goalRise = cl((p - 0.08) / 0.30); // rise/reveal p=0.08 → 0.38, then it PINS (gp=1)
      const gp = ease(goalRise);
      const par = gp * 40;
      if (mediaWrapRef.current) {
        mediaWrapRef.current.style.transform = "translateY(-" + par.toFixed(2) + "vh)";
      }

      // 2. hero text overlay: drifts UP with the video (0.7× — a bit faster now) — NO fade (it's
      //    simply covered by the rising Scopul panel).
      if (videoUiRef.current) videoUiRef.current.style.transform = "translateY(-" + (par * 0.7).toFixed(2) + "vh)";

      // 3. header auto-hide (everywhere): scroll down → slide up (hide); scroll up → slide back
      //    down (show). Stays put near the very top so a tiny scroll doesn't flicker it.
      const dy = y - lastNavY;
      if (Math.abs(dy) > 3) {
        navDir = dy > 0 ? "down" : "up";
        lastNavY = y;
      }
      if (navRef.current)
        navRef.current.style.transform =
          navDir === "down" && y > 80 ? "translateY(-135%)" : "translateY(0)";

      // 5. the WHOLE goal section (title + collage + chunk) rises up from the bottom
      //    the instant the marquee stops, locked to the video parallax. Once fully
      //    risen (~p=0.32) gp clamps to 1, so it PINS in place — held there while the
      //    chunk reveals and the images fuse. It then scrolls away naturally when the
      //    sticky scrub container ends (the default hand-off into the team section).
      if (goalRef.current) {
        goalRef.current.style.transform = "translateY(" + ((1 - gp) * 100).toFixed(3) + "%)";
      }

      // 6. chunk reveal: ROW-SYNCED. Each row starts revealing the moment its top rises
      //    into view and FINISHES exactly when the next row appears below it — so the
      //    letter speed isn't constant, it tracks the rise. Within a row it's still
      //    literal letter-by-letter (one char transitioning at a time).
      const chars = charsRef.current;
      const N = chars.length;
      if (N && numRows > 0) {
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
        if (p <= pVis[0]) {
          if (revealState !== "before") {
            for (let i = 0; i < N; i++) setOpac(i, 0.2);
            revealState = "before";
          }
        } else if (p >= pVisEnd) {
          if (revealState !== "after") {
            for (let i = 0; i < N; i++) setOpac(i, 1);
            revealState = "after";
          }
        } else {
          revealState = "during";
          for (let i = 0; i < N; i++) {
            const k = rowOf[i];
            const rs = pVis[k];
            const re = k + 1 < numRows ? pVis[k + 1] : pVisEnd;
            let o;
            if (p >= re) o = 1;
            else if (p < rs) o = 0.2;
            else {
              // sweep this row's chars left→right over its [appear, next-appears] window
              const cursor = ((p - rs) / (re - rs)) * rowLen[k];
              let frac = cursor - (i - rowStartChar[k]);
              frac = frac < 0 ? 0 : frac > 1 ? 1 : frac;
              o = 0.2 + 0.8 * frac;
            }
            setOpac(i, o);
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
      // the fill fires right after the chunk reveal finishes (pVisEnd), and the grow
      // follows it — both keyed off the reveal end so they track the text, not fixed p.
      const fuseAt = pVisEnd + 0.03;
      const f = fusedRef.current;
      if (f) {
        // SYMMETRIC: fuse when crossing fuseAt scrolling down, and un-fuse at the exact
        // same point scrolling back up. The state guard only writes on a real crossing,
        // so the CSS clip transition plays cleanly each way (Lenis scroll is smooth, so
        // there's no jitter to restart it mid-fill).
        const shouldFuse = p >= fuseAt;
        if (shouldFuse !== fusedPlayed) {
          fusedPlayed = shouldFuse;
          f.style.clipPath = shouldFuse ? "inset(0 0 0 0)" : "inset(0 0 100% 0)";
        }
      }

      // 8. ECHIPA HAND-OFF — PIN & RELEASE: Echipa is its OWN section right below this one.
      //    Its Dr. 1 image (echDr1Ref) is handed off from the Scopul collage: it's pinned to
      //    the viewport (position:fixed) and grown from the collage rect to the Echipa left-half
      //    over a scroll window ending exactly at Echipa's top, then RELEASED to absolute so
      //    Echipa's own carousel wipes Dr. 2/3 over it. One element throughout, no fade.
      const el = echDr1Ref.current;
      if (el) {
        const lockY = rootTop + total + window.innerHeight; // Echipa's top (this container's bottom)
        // Travel MUST be ≥ 1·vh: Scopul's sticky releases at lockY − vh, so the morph has to
        // begin while Scopul is still pinned (fused image on screen) and stay pinned across the
        // unpin — otherwise the fused image scrolls away before the doctor image grows in.
        // start the morph earlier (1.6vh window, was 1.1) so the fused image begins traveling to
        // Echipa soon after it fuses — turning what was dead scroll into the hand-off animation.
        const spanStartY = lockY - window.innerHeight * 1.6;
        if (y < spanStartY) {
          // pre-hand-off: Scopul still owns the fused image; keep Dr. 1 hidden in its base slot
          el.style.position = "absolute";
          el.style.opacity = "0";
          if (collageAreaRef.current) collageAreaRef.current.style.opacity = "1";
        } else if (y < lockY) {
          // TRAVEL: pin to the viewport and grow collage-rect → measured left-half slot
          const g = ease(cl((y - spanStartY) / (lockY - spanStartY)));
          el.style.position = "fixed";
          el.style.zIndex = "15";
          el.style.opacity = "1";
          el.style.left = (morphStart.left * (1 - g)).toFixed(2) + "px";
          el.style.top = (morphStart.top * (1 - g)).toFixed(2) + "px";
          el.style.width = (morphStart.width + (lockTarget.w - morphStart.width) * g).toFixed(2) + "px";
          el.style.height = (morphStart.height + (lockTarget.h - morphStart.height) * g).toFixed(2) + "px";
          if (collageAreaRef.current) collageAreaRef.current.style.opacity = "0"; // avoid two images
        } else {
          // RELEASE: back to natural flow, fills the Echipa left-half as the carousel base
          el.style.position = "absolute";
          el.style.zIndex = "1";
          el.style.opacity = "1";
          el.style.left = "0px";
          el.style.top = "0px";
          el.style.width = "100%";
          el.style.height = "100%";
          if (collageAreaRef.current) collageAreaRef.current.style.opacity = "0";
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

  // ── header link scrolling (Lenis-aware) ──
  const lenis = useLenis();
  const goTo = (target: number | string) => {
    const el = typeof target === "string" ? (document.querySelector(target) as HTMLElement | null) : null;
    if (typeof target === "string" && !el) return;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(el ?? (target as number), { offset: el ? -64 : 0 });
    } else if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: "smooth" });
    } else {
      window.scrollTo({ top: target as number, behavior: "smooth" });
    }
  };

  return (
    <>
    {/* ── nav — rendered at the TOP LEVEL (not inside the sticky) so it's in the root stacking
        context and stays above every section. Fixed, full-width auto-hiding bar. ── */}
    <div
      ref={navRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 44px",
        boxSizing: "border-box",
        background: "transparent",
        transform: "translateY(0)",
        transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
        willChange: "transform",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- brand logo SVG */}
        <img
          src="/caracas-logo.svg"
          alt="Caracaș Dental"
          onClick={() => goTo(0)}
          style={{ height: "34px", width: "auto", display: "block", cursor: "pointer", filter: "var(--logo-filter, none)", transition: "filter 0.3s ease" }}
        />
        <div
          onClick={() => goTo("#servicii")}
          style={{ ...navRowText, gap: "10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--nav-fg-left, rgba(28,43,48,0.72))", transition: "color 0.3s ease" }}
        >
          {t.nav.menu}
          <svg width="17" height="11" viewBox="0 0 18 12" fill="none">
            <path d="M1 3.5h16M1 8.5h16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "26px", color: "var(--nav-fg, #1c2b30)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {(["ro", "ru"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                appearance: "none",
                border: 0,
                background: "transparent",
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                padding: "3px 0",
                color: "currentColor",
                opacity: lang === l ? 1 : 0.4,
                borderBottom: lang === l ? "1.5px solid currentColor" : "1.5px solid transparent",
                transition: "opacity 0.2s",
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => goTo(document.documentElement.scrollHeight)}
          style={{
            appearance: "none",
            border: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "var(--btn-bg, #eb7180)",
            color: "var(--btn-fg, #ffffff)",
            borderRadius: "999px",
            padding: "8px 8px 8px 22px",
            marginLeft: "2px",
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.03em" }}>{t.nav.contact}</span>
          <span
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "999px",
              border: "1.5px solid currentColor",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>
    </div>

    <div ref={rootRef} style={{ position: "relative", height: `${scrubHeight}vh`, background: panelColor, overflowX: "clip" }}>
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
          // Full-bleed video (inset:0, no clip, no corners); the sliding left panel reveals it.
          style={{ position: "absolute", inset: 0, overflow: "hidden", background: MEDIA_BG, zIndex: 1, willChange: "transform" }}
        >
          <div
            ref={mediaInnerRef}
            style={{
              position: "absolute",
              inset: 0,
              // static, centered — no horizontal pan on scroll (removed). Slight scale so the
              // cover crop never shows an edge.
              transform: "scale(1.06)",
              transformOrigin: "center center",
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
              height: "62%",
              background: "linear-gradient(to top, rgba(9,22,28,0.78), rgba(9,22,28,0))",
              pointerEvents: "none",
              opacity: 1,
              zIndex: 3,
            }}
          />
        </div>

        {/* ── hero text + button, overlaid on the full-screen video (drifts up slower than the
            video on scroll, no fade) ── */}
        <div
          ref={videoUiRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 6,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "flex-start",
            padding: "0 clamp(24px,6vw,92px) clamp(46px,9vh,96px)",
            pointerEvents: "none",
            willChange: "transform",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: serifFont,
              fontWeight: 400,
              fontSize: "clamp(44px, 6.4vw, 112px)",
              lineHeight: 1.02,
              letterSpacing: "-0.015em",
              color: LIGHT,
              maxWidth: "16ch",
              textShadow: "0 2px 34px rgba(0,0,0,0.45)",
            }}
          >
            {t.hero.l1}
            <br />
            {t.hero.l2} <span style={{ fontStyle: "italic" }}>{t.hero.accent}</span>
          </h1>
          <p
            style={{
              margin: "22px 0 0",
              maxWidth: "48ch",
              fontFamily: FONT,
              fontSize: "clamp(15px, 1.15vw, 18px)",
              fontWeight: 500,
              lineHeight: 1.6,
              color: "#ffffff",
              textShadow: "0 1px 18px rgba(0,0,0,0.55)",
            }}
          >
            {t.hero.sub}
          </p>
        </div>

        {/* video-side stat cards removed at user's request; the video card is kept clean. */}

        {/* nav lives at the TOP LEVEL of the fragment (below), NOT here — inside this
            position:sticky container it would be trapped in the sticky's stacking context and
            later sections would paint over it. */}

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
                  top: "13%",
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
                      <ImageSlot bg="#dbe3e3" src={CLINIC_IMAGES[k]} label={t.collage(k + 1)} />
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
                    background: "#dbe3e3",
                    clipPath: "inset(0 0 100% 0)",
                    transition: "clip-path 0.9s cubic-bezier(0.7,0,0.25,1)",
                    pointerEvents: "none",
                    willChange: "clip-path",
                  }}
                >
                  <ImageSlot bg="#dbe3e3" src={DOCTOR_PHOTOS[0]} label={t.doctors[0].name.join(" ")} />
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
                  top: "13%",
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

      </div>
    </div>

    {/* ── ECHIPA NOASTRĂ — its OWN section you scroll down into. Its Dr. 1 image is handed
        off from the Scopul collage (pinned & grown in by the scroll driver above via
        echDr1Ref), then released as this section's carousel base. ── */}
    <EchipaSection dr1Ref={echDr1Ref} doctors={t.doctors} photos={DOCTOR_PHOTOS} candids={DOCTOR_CANDIDS} book={t.book} serif={serifFont} />

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
        <ResultsBlock tiles={t.results.tiles.slice(0, 5)} images={RESULT_IMAGES.slice(0, 5)} />
        <ResultsBlock tiles={t.results.tiles.slice(5, 10)} images={RESULT_IMAGES.slice(5, 10)} reversed />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(36px,5vh,64px)" }}>
        <button
          style={{
            appearance: "none",
            border: 0,
            cursor: "pointer",
            background: ACCENT,
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

    {/* ── DRUMUL TĂU — free-consultation path as a vertical timeline → CTA ── */}
    <ConsultationTimeline
      eyebrow={t.process.eyebrow}
      title={t.process.title}
      label={t.process.label}
      steps={t.process.steps}
      cta={t.process.cta}
      serif={serifFont}
    />

    {/* ── ÎNTREBĂRI FRECVENTE — small, quiet FAQ right before the footer ── */}
    <FaqSection faq={t.faq} serif={serifFont} />

    {/* ── PREFOOTER image + animated FOOTER (rises over it, circular top) ── */}
    <SiteFooter footer={t.footer} book={t.book} serif={serifFont} />
    </>
  );
}
