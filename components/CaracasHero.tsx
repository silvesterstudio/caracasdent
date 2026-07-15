"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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

// The site uses exactly TWO typefaces, nothing else:
//   • Inter Tight       — all UI / body / labels + the hero's main display line (FONT)
//   • PP Editorial New   — every editorial headline / italic accent word (SERIF)
// (PP Editorial New is self-hosted via @font-face in globals.css; where it's not
//  present it falls back to Instrument Serif. Tokens live in :root as --sans / --editorial.)
const FONT = "var(--sans)";
const SERIF = "var(--editorial)";

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
// ── "Cine suntem?" — ONE tall photo at a time shared by all 4 collage strips. Each
//    strip is a clipped window onto its quarter of the current image, so the 12px
//    gaps read as cuts through a single picture (and it parallaxes behind them).
//    The roster below rotates every 1.5s with a scan-line wipe — swap in the
//    clinic's real team photography later (keep the tall ~2:3 portrait crop).
const CINE_IMAGES = [
  U("1588776813941-dcf9c55e84d2", 1000, 1500),
  U("1674775372058-c4c8813c6611", 1000, 1500, true),
  U("1670191247079-f9713ae06dcf", 1000, 1500, true),
  U("1683349370055-7eba66a404c6", 1000, 1500),
  U("1667133295308-9ef24f71952e", 1000, 1500, true),
];
// ── expanded-menu service cards (square crops of the 4 service photos, shown B&W like the reference)
const MENU_SERVICE_IMAGES = [
  U("1588776813941-dcf9c55e84d2", 600, 600), // Implantologie
  U("1567516364473-233c4b6fcfbe", 600, 600, true), // Ortodonție
  U("1662837775286-7e6258c7c595", 600, 600), // Terapie
  U("1489278353717-f64c6ee8a4d2", 600, 600, true), // Estetică dentară
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
  menuLinks: { label: string; target: string }[]; // the BIG serif links (2-col grid, reference "About Us / Laboratory / …")
  menuUtility: { label: string; target: string }[]; // small arrowed rows bottom-left (reference "Patient form / FAQ")
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
  aboutMore: string;
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
    menuLinks: [
      { label: "Echipa", target: "#echipa" },
      { label: "Rezultate", target: "#rezultate" },
      { label: "Drumul tău", target: "#drumul" },
      { label: "Contact", target: "footer" },
    ],
    menuUtility: [
      { label: "Formular pacient", target: "footer" },
      { label: "Întrebări frecvente", target: "#faq" },
    ],
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
    goalTitle: "Cine suntem?",
    // condensed from the company history (1992, Bender — Dr. Ion + Dr. Elena Caracaș,
    // 25+ ani, parteneriate exclusive, valori: înțelegere și siguranță)
    // *runs* render in the editorial italic (mosaicist-style accents)
    paragraph:
      "O *familie de medici* cu o istorie de peste 25 de ani: din 1992, când *Dr. Ion Caracaș* și *Dr. Elena Caracaș* au deschis prima clinică privată, construim stomatologie bazată pe înțelegere, siguranță și cele mai înalte standarde.",
    aboutMore: "Mai multe",
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
    menuLinks: [
      { label: "Команда", target: "#echipa" },
      { label: "Результаты", target: "#rezultate" },
      { label: "Ваш путь", target: "#drumul" },
      { label: "Контакты", target: "footer" },
    ],
    menuUtility: [
      { label: "Анкета пациента", target: "footer" },
      { label: "Частые вопросы", target: "#faq" },
    ],
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
    goalTitle: "Кто мы?",
    paragraph:
      "*Семья врачей* с историей более 25 лет: с 1992 года, когда *д-р Ион Каракаш* и *д-р Елена Каракаш* открыли первую частную клинику, мы строим стоматологию, основанную на понимании, безопасности и высочайших стандартах.",
    aboutMore: "Подробнее",
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
  // scrubHeight is the hero's total scroll length (in vh). 210 makes total = 110vh: 10vh of
  // video-only scroll, then the panel rises 100vh over exactly 100vh of scroll — i.e. at 1×
  // scroll speed. Because post-unpin scrolling is ALSO 1×, the panel's velocity is continuous
  // through the release and the end-of-section BUMP disappears entirely.
  scrubHeight = 210,
  marqueeTravel = 430,
  // white, matching the left panel — so the framed video card's surround reads as the same
  // sheet as the panel (no #f4f6f6 vs #fff seam around the card).
  panelColor = LIGHT,
}: CaracasHeroProps) {
  const [lang, setLang] = useState<"ro" | "ru">("ro");
  const [menuOpen, setMenuOpen] = useState(false);
  // mirror for the scroll driver: while the menu sheet is open the header must render its
  // "over dark" look (transparent bg, white ink) and stay shown, whatever the scroll state.
  const menuOpenRef = useRef(false);
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
  // the inner copies of the CURRENT photo (one per strip), double-buffered: layer A
  // and layer B alternate as front/incoming so the next photo can wipe in over the
  // current one. Every copy gets the same per-frame translateY so the picture
  // drifts behind the fixed slits (parallax) while the slices stay aligned.
  const sliceImgsARef = useRef<Array<HTMLImageElement | null>>([]);
  const sliceImgsBRef = useRef<Array<HTMLImageElement | null>>([]);
  // latest scroll progress, published by update() for the slideshow timer (it only
  // cycles once the section has actually risen into view).
  const scrollPRef = useRef(0);
  const charsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const chunkRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const collageAreaRef = useRef<HTMLDivElement>(null);
  // Echipa's Dr. 1 image element (kept for the prop interface; it's now simply the
  // static carousel base — the old pin-and-grow hand-off was removed).
  const echDr1Ref = useRef<HTMLDivElement>(null);
  const imgShownRef = useRef<boolean[]>([]);
  const forceRevealRef = useRef(false);
  const updateRef = useRef<() => void>(() => {});
  const measureRef = useRef<() => void>(() => {});

  // ── paragraph → per-word / per-character spans. The words keep whole on their
  //    line (nowrap) while every character darkens grey→ink in reading order as
  //    the reveal sweep passes over it (mid-word reveal, like the reference).
  //    Runs wrapped in *asterisks* render in the EDITORIAL ITALIC (the hero's accent
  //    treatment — mosaicist-style mixed sans/serif body). ──
  const paragraphNodes = useMemo(() => {
    charsRef.current = [];
    // tokenize into words carrying an italic flag: segments between * pairs are italic
    const tokens: { word: string; italic: boolean }[] = [];
    String(t.paragraph)
      .split("*")
      .forEach((seg, si) => {
        const italic = si % 2 === 1;
        seg.split(" ").forEach((w) => {
          if (w.length) tokens.push({ word: w, italic });
        });
      });
    let idx = 0;
    const nodes: React.ReactNode[] = [];
    tokens.forEach((tk, wi) => {
      const letters: React.ReactNode[] = [];
      for (let i = 0; i < tk.word.length; i++) {
        const at = idx++;
        letters.push(
          <span
            key={`l${wi}_${i}`}
            ref={(el) => {
              charsRef.current[at] = el;
            }}
            style={{ display: "inline-block", opacity: 0.2, willChange: "opacity" }}
          >
            {tk.word[i]}
          </span>
        );
      }
      nodes.push(
        <span
          key={`w${wi}`}
          style={{
            whiteSpace: "nowrap",
            // slight size bump so the serif matches the sans optically (same trick as
            // the hero's "noastră"), plus a hairline text-stroke to bring the single-weight
            // (400) serif up to the visual weight of the surrounding Inter Tight 500
            ...(tk.italic
              ? {
                  fontFamily: SERIF,
                  fontStyle: "italic" as const,
                  fontSize: "1.05em",
                  WebkitTextStrokeWidth: "0.017em",
                  WebkitTextStrokeColor: "currentcolor",
                }
              : null),
          }}
        >
          {letters}
        </span>
      );
      if (wi < tokens.length - 1) {
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

    // cached layout metrics — refreshed on resize only, never on scroll
    let total = 0;
    let rootTop = 0;
    let marqueeStopVw = -300; // where the marquee freezes: last word at the left edge
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
          const topPx = H * 0.085; // the chunk starts right under the floating header
          const fillH = H - topPx - H * 0.11; // fill nearly the whole column (button room below)
          fs = Math.min(240, Math.max(24, (fs * fillH) / h));
          ch.style.fontSize = fs + "px";
          h = ch.scrollHeight;
          let grow = 0;
          while (topPx + h < H * 0.89 && fs < 240 && grow < 14) {
            fs *= 1.035;
            ch.style.fontSize = fs + "px";
            h = ch.scrollHeight;
            grow++;
          }
          let guard = 0;
          while (topPx + h > H * 0.9 && fs > 24 && guard < 14) {
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
          // tolerance 12px (was 6): the italic serif words sit in a slightly taller box at
          // 1.05em, so same-row chars can differ by up to ~6-7px at the largest font sizes
          if (curTop === null || ot > curTop + 12) {
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
        // the rise is LINEAR (gp = (p-0.10)/0.75), so gp→p inverts directly.
        // one row height (px), to key off a row being FULLY in view (its bottom edge
        // entered) rather than just its top peeking at the very bottom.
        const rowH = numRows > 1 ? rowTops[1] - rowTops[0] : H * 0.12;
        pVis = [];
        for (let k = 0; k < numRows; k++) {
          // chunk sits at top:8.5% of the panel(=viewport); a row's BOTTOM is at panel-y =
          // 0.085*H + rowTops[k] + rowH; it clears the viewport bottom (row fully visible)
          // when translateY = (1-gp)*H drops to H − that, i.e. gp = 0.085 + (rowTops[k]+rowH)/H.
          const gpVis = 0.085 + (rowTops[k] + rowH) / H;
          pVis[k] = 0.091 + Math.min(1, gpVis) * 0.909;
        }
        const lastWin = numRows > 1 ? pVis[numRows - 1] - pVis[numRows - 2] : 0.03;
        // clamp: the last row must FINISH revealing before the scrub ends (p=1), otherwise
        // its final chars would freeze mid-reveal as the section scrolls away.
        pVisEnd = Math.min(0.99, numRows > 0 ? pVis[numRows - 1] + Math.max(0.02, lastWin) : 0.22);
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
      }
    };

    let revealState = "";
    // last opacity written per char, so the reveal loop only touches the DOM for
    // chars whose value actually changed this frame (the moving wave band is a
    // couple dozen chars, not the whole ~230-char paragraph) — this avoids a
    // per-frame style-recalc storm across every span.
    let prevOpac: number[] = [];

    const update = () => {
      if (!rootRef.current) return;
      const y = window.scrollY;
      let p = total > 0 ? (y - rootTop) / total : 0;
      p = cl(p);
      scrollPRef.current = p;

      // 1. HEADER: fully static now — fixed in place, transparent, always-white elements over
      //    a black gradient scrim (rendered in the JSX). No scroll-driven appearance changes,
      //    no auto-hide. Nothing to drive per-frame.
      // The video does NOT pan horizontally (removed). It only drifts UP as the section rises
      // over it; the hero text drifts up too but SLOWER (0.7×) so it lags behind = depth.
      // The rise is LINEAR and, crucially, moves at EXACTLY 1× scroll speed: with total=110vh,
      // gp spans p 0.091 → 1.0, i.e. 100vh of panel travel over 100vh of scroll. The panel's
      // velocity is therefore identical before and after the sticky releases (both 1×), so the
      // hand-over to normal scrolling is seamless — no bump, no dead stop, no speed change.
      const goalRise = cl((p - 0.091) / 0.909);
      const gp = goalRise;
      const par = gp * 40;
      if (mediaWrapRef.current) {
        mediaWrapRef.current.style.transform = "translateY(-" + par.toFixed(2) + "vh)";
      }

      // 2. hero text overlay: drifts UP with the video (0.7× — a bit faster now) — NO fade (it's
      //    simply covered by the rising Scopul panel).
      if (videoUiRef.current) videoUiRef.current.style.transform = "translateY(-" + (par * 0.7).toFixed(2) + "vh)";

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

      // 7. collage: each image POPS in (2s zoom 1.2→1.0) as its cue passes while the
      //    section rises, stacking over the ones before it — a time-based pop.
      //    (The 4→1 FUSE and the pin-and-grow hand-off into Echipa were both removed —
      //    the collage stays 4 images, and Echipa owns its own static Dr. 1 base.)
      const imgs = imgsRef.current;
      const shown = imgShownRef.current;
      for (let k = 0; k < imgs.length; k++) {
        const el = imgs[k];
        if (!el) continue;
        const trig = 0.14 + k * 0.05; // spread over the (shorter) scrub so they still pop one-by-one
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

      // 8. sliced-photo parallax: all 4 strips show the SAME image, and every copy
      //    (both slideshow buffers) gets the SAME translateY each frame — so the
      //    slices always stay aligned with each other while the picture drifts
      //    slowly behind the fixed gaps (±36px over the rise = depth behind slits).
      const slicePar = "translateY(" + ((gp - 0.5) * 72).toFixed(2) + "px)";
      for (const im of sliceImgsARef.current) {
        if (im) im.style.transform = slicePar;
      }
      for (const im of sliceImgsBRef.current) {
        if (im) im.style.transform = slicePar;
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

  // ── "Cine suntem?" slideshow: rotate the sliced photo through CINE_IMAGES.
  //    Because every strip's img spans the SAME composite space (full collage +
  //    headroom), one synchronized clip-path wipe on the 4 incoming copies reads
  //    as a single scan line travelling DOWN the whole picture — revealing strip 1,
  //    crossing the gap, then strip 2, 3, 4, one layer at a time.
  //    Double-buffered (A/B alternate front/incoming) + preloaded: the incoming
  //    buffer's src is set and decode()d BEFORE the wipe starts, and the image
  //    after next is warmed into the HTTP cache during the hold.
  useEffect(() => {
    const WIPE = 700; // scan-line sweep duration (ms)
    const HOLD = 1500; // rest between wipes (ms) — "changes every 1.5s"
    let front: "A" | "B" = "A";
    let idx = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const preloaded = new Set<string>([CINE_IMAGES[0], CINE_IMAGES[1]]);
    const preload = (src: string) => {
      if (preloaded.has(src)) return;
      preloaded.add(src);
      const im = new window.Image();
      im.src = src;
    };
    const schedule = (ms: number) => {
      timer = setTimeout(tick, ms);
    };
    const tick = () => {
      if (stopped) return;
      // don't burn cycles (or surprise the user) before the section has risen in,
      // or while the tab is hidden — check again shortly instead.
      if (document.hidden || scrollPRef.current < 0.14) {
        schedule(400);
        return;
      }
      const incoming = (front === "A" ? sliceImgsBRef : sliceImgsARef).current.filter(Boolean) as HTMLImageElement[];
      const outgoing = (front === "A" ? sliceImgsARef : sliceImgsBRef).current.filter(Boolean) as HTMLImageElement[];
      if (incoming.length < 4 || outgoing.length < 4) {
        schedule(400);
        return;
      }
      const nextIdx = (idx + 1) % CINE_IMAGES.length;
      const nextSrc = CINE_IMAGES[nextIdx];
      for (const im of incoming) {
        im.style.transition = "none";
        im.style.clipPath = "inset(0 0 100% 0)"; // fully hidden; will reveal top→bottom
        im.style.zIndex = "2";
        if (im.src !== nextSrc) im.src = nextSrc;
      }
      for (const im of outgoing) im.style.zIndex = "1";
      // decode() = the preload guarantee: the wipe only starts once every copy of
      // the next photo is ready to paint, so the scan line never reveals a blank.
      Promise.all(incoming.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()))).then(() => {
        if (stopped) return;
        void incoming[0].offsetWidth; // commit the hidden clip before transitioning
        for (const im of incoming) {
          im.style.transition = `clip-path ${WIPE}ms cubic-bezier(0.45,0,0.2,1)`;
          im.style.clipPath = "inset(0 0 0% 0)";
        }
        idx = nextIdx;
        front = front === "A" ? "B" : "A";
        preload(CINE_IMAGES[(nextIdx + 1) % CINE_IMAGES.length]); // warm the one after
        schedule(WIPE + HOLD);
      });
    };
    schedule(HOLD + 600); // first rotation a beat after the pops settle
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

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

  // menu-overlay navigation: close the sheet, then scroll to the target (a section
  // selector, the very top, or the footer/contact at the bottom of the document).
  const menuNav = (target: string) => {
    setMenuOpen(false);
    if (target === "top") goTo(0);
    else if (target === "footer") goTo(document.documentElement.scrollHeight);
    else goTo(target);
  };

  // freeze the (Lenis) page scroll while the menu overlay is open, and re-run the scroll
  // driver so the header immediately flips to / from its over-dark (transparent) look.
  useEffect(() => {
    menuOpenRef.current = menuOpen;
    updateRef.current();
    if (!lenis) return;
    if (menuOpen) lenis.stop();
    else lenis.start();
    return () => lenis.start();
  }, [menuOpen, lenis]);

  return (
    <>
    {/* ── nav — rendered at the TOP LEVEL (not inside the sticky) so it's in the root stacking
        context and stays above every section. STATIC: fixed in place (no auto-hide), no
        background bar — the elements are always white and sit on a black gradient SCRIM
        (the child div below) so they stay readable over any section, light or dark. ── */}
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
      }}
    >
      {/* readability scrim — black fade painted UNDER the header elements (zIndex:-1 keeps it
          behind them but still above the page, since the nav is its own stacking context) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "170px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.26) 45%, rgba(0,0,0,0) 100%)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- brand logo SVG */}
        <img
          src="/caracas-logo.svg"
          alt="Caracaș Dental"
          onClick={() => {
            setMenuOpen(false);
            goTo(0);
          }}
          style={{ height: "34px", width: "auto", display: "block", cursor: "pointer", filter: "brightness(0) invert(1)" }}
        />
        {/* the SAME button opens and closes the sheet — the header never changes, only the
            icon flips ☰ ↔ ✕ (reference behaviour: the page slides under the static header) */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={t.nav.menu}
          aria-expanded={menuOpen}
          style={{ ...navRowText, appearance: "none", border: 0, background: "transparent", padding: 0, gap: "10px", cursor: "pointer", fontFamily: FONT, fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.92)" }}
        >
          {t.nav.menu}
          {menuOpen ? (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="17" height="11" viewBox="0 0 18 12" fill="none">
              <path d="M1 3.5h16M1 8.5h16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "26px", color: "#ffffff" }}>
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
                fontWeight: 500,
                letterSpacing: "0.08em",
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
        {/* Contact — EXACTLY the hero CTA design: solid #dad3d1 rectangle (3px), dark text,
            plain ↗ arrow. Static colors in every header state (no --btn-bg/--btn-fg vars). */}
        <button
          onClick={() => {
            setMenuOpen(false);
            goTo(document.documentElement.scrollHeight);
          }}
          style={{
            appearance: "none",
            border: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: "#dad3d1",
            color: "#161516",
            borderRadius: "3px",
            padding: "11px 20px",
            marginLeft: "2px",
            fontFamily: FONT,
            fontSize: "1.04vw",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
          }}
        >
          {t.nav.contact}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
            <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="#161516" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    {/* ── EXPANDED MENU — full-screen dark sheet in the Aventura Dental Arts pattern: it slides
        DOWN from the top UNDER the fixed header (zIndex below the nav's 100 — the header itself
        never changes, only the page goes under it; the nav just flips to its over-dark look and
        its Meniu button becomes the ✕). Content is already laid out (no per-item stagger) and
        rides in on an ease-out curve (fast start, slowing to a stop). Left rail = socials +
        small arrowed utility rows; right zone = "Servicii:" with 4 B&W image cards, then the
        big editorial-serif links in a 2-column grid. Page scroll frozen while open. ── */}
    <div
      aria-hidden={!menuOpen}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "linear-gradient(158deg,#161d21 0%,#0d1114 58%,#0a0d10 100%)",
        color: "#eef1f2",
        transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
        pointerEvents: menuOpen ? "auto" : "none",
        transition: "transform 0.9s cubic-bezier(0.16,1,0.3,1)",
        willChange: "transform",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── main area: LEFT rail (socials + arrowed utility rows, pinned to the bottom)
             | RIGHT zone ("Servicii:" + 4 B&W cards on top, big serif links below).
             Top padding clears the fixed header floating above the sheet. ── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: "clamp(24px,4vw,80px)", padding: "clamp(64px,10vh,96px) 44px clamp(20px,4vh,44px)" }}>
        {/* LEFT rail */}
        <div style={{ flex: "0 0 clamp(200px,23vw,340px)", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "clamp(22px,4.5vh,48px)" }}>
          {/* socials — faint circles (wire real profile URLs later) */}
          <div style={{ display: "flex", gap: "14px" }}>
            <button aria-label="Instagram" style={{ appearance: "none", border: 0, cursor: "pointer", width: "54px", height: "54px", borderRadius: "999px", background: "rgba(238,241,242,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#eef1f2" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" />
              </svg>
            </button>
            <button aria-label="Facebook" style={{ appearance: "none", border: 0, cursor: "pointer", width: "54px", height: "54px", borderRadius: "999px", background: "rgba(238,241,242,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#eef1f2" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M14.5 8.5V6.8c0-.9.6-1.3 1.4-1.3h1.6V2.6h-2.6c-2.6 0-3.9 1.7-3.9 4v1.9H8.5V12h2.5v9.4h3.5V12h2.6l.4-3.5h-3Z" fill="currentColor" />
              </svg>
            </button>
          </div>
          {/* small utility rows, hairline-divided, with ↗ arrows */}
          <div>
            {t.menuUtility.map((u, i) => (
              <button
                key={i}
                className="cd-menu-util"
                onClick={() => menuNav(u.target)}
                style={{
                  appearance: "none",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  padding: "clamp(14px,2.6vh,22px) 0",
                  borderTop: "1px solid rgba(238,241,242,0.16)",
                  borderBottom: i === t.menuUtility.length - 1 ? "1px solid rgba(238,241,242,0.16)" : undefined,
                  fontFamily: FONT,
                  fontSize: "clamp(13px,1vw,16px)",
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                  color: "#eef1f2",
                  textAlign: "left",
                }}
              >
                {u.label}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                  <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT zone */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "clamp(16px,3vh,34px)" }}>
          {/* "Servicii:" + the 4 service cards (B&W, colorize + zoom on hover) */}
          <div>
            <div
              className="cd-menu-big"
              onClick={() => menuNav("#servicii")}
              style={{ fontFamily: serifFont, fontWeight: 400, fontSize: "clamp(34px,4.4vw,70px)", lineHeight: 1, letterSpacing: "-0.01em", cursor: "pointer", display: "inline-block" }}
            >
              {t.nav.services}:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(12px,1.4vw,24px)", marginTop: "clamp(14px,3vh,30px)" }}>
              {t.services.steps.map((s, i) => (
                <button
                  key={i}
                  className="cd-menu-card"
                  onClick={() => menuNav("#servicii")}
                  style={{ appearance: "none", border: 0, background: "transparent", padding: 0, cursor: "pointer", textAlign: "left", minWidth: 0 }}
                >
                  <div style={{ width: "100%", height: "clamp(110px,26vh,250px)", overflow: "hidden", background: "#1b2126" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- menu mock-up card */}
                    <img src={MENU_SERVICE_IMAGES[i]} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(1)" }} />
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: "clamp(13px,1.05vw,17px)", fontWeight: 400, letterSpacing: "-0.01em", color: "#eef1f2", marginTop: "10px" }}>
                    {s.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* big editorial links, 2-column grid (reference "About Us / Laboratory / …") */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "clamp(30px,4vw,90px)", rowGap: "clamp(2px,1vh,12px)" }}>
            {t.menuLinks.map((lnk) => (
              <button
                key={lnk.target}
                className="cd-menu-big"
                onClick={() => menuNav(lnk.target)}
                style={{
                  appearance: "none",
                  border: 0,
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: serifFont,
                  fontWeight: 400,
                  fontSize: "clamp(36px,4.9vw,80px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.01em",
                  color: "#eef1f2",
                  whiteSpace: "nowrap",
                }}
              >
                {lnk.label}
              </button>
            ))}
          </div>
        </div>
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
          {/* (the old top gradient was removed — the global header scrim covers that zone) */}
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

        {/* ── hero content, overlaid on the full-screen video — matched to the mosaicist
            reference: a tight full-bleed hairline sitting ABOVE (never over) a giant bottom-left
            headline (Inter Tight 500, accent word in the editorial serif at the SAME size+weight),
            with a small description over a solid light CTA bottom-right. All in warm #dad3d1.
            The group drifts up slower than the video on scroll (no fade). ── */}
        <div
          ref={videoUiRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 6,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            pointerEvents: "none",
            willChange: "transform",
          }}
        >
          {/* tight full-bleed hairline — its own flow row ABOVE the headline, so it can never
              overlap the text (the earlier absolute line cut through the letters). */}
          <div style={{ width: "100%", height: "1px", background: "rgba(218,211,209,0.42)", marginBottom: "clamp(30px,5.5vh,66px)" }} />

          {/* bottom row: giant headline (left) ⇄ description-over-CTA (right). The right column
              STRETCHES to the headline height so the sub sits at its TOP and the CTA at its
              BOTTOM — the reference composition. */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              justifyContent: "space-between",
              gap: "clamp(24px,5vw,90px)",
              padding: "0 clamp(22px,2.6vw,44px) clamp(26px,4.5vh,44px)",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: "7.81vw",
                lineHeight: "95%",
                letterSpacing: "-0.03em",
                color: "#dad3d1",
              }}
            >
              {t.hero.l1}
              <br />
              {t.hero.l2}{" "}
              {/* SAME weight as the sans line; family = editorial serif. The serif is optically
                  smaller than Inter Tight at an equal font-size, so it's scaled up ~13% to match
                  the visual size of "Misiunea". (With the real PP Editorial New — which matches
                  Inter Tight's optical size — this multiplier can drop back toward 1em.) */}
              <span style={{ fontFamily: serifFont, fontStyle: "italic", fontWeight: 500, fontSize: "1.08em", lineHeight: "0.8" }}>{t.hero.accent}</span>
            </h1>

            <div
              style={{
                flex: "none",
                maxWidth: "27ch",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "clamp(18px,3vh,34px)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: FONT,
                  fontSize: "1.04vw",
                  fontWeight: 300,
                  lineHeight: "130%",
                  letterSpacing: "-0.03em",
                  color: "#dad3d1",
                }}
              >
                {t.hero.sub}
              </p>
              <button
                onClick={() => goTo(document.documentElement.scrollHeight)}
                style={{
                  pointerEvents: "auto",
                  appearance: "none",
                  border: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "#dad3d1",
                  color: "#161516",
                  borderRadius: "3px",
                  padding: "11px 20px",
                  fontFamily: FONT,
                  fontSize: "1.04vw",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  whiteSpace: "nowrap",
                }}
              >
                {t.book}
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                  <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="#161516" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

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
              {/* heading in the HERO's type system: Inter Tight 500 with the last word in
                  editorial italic — "Cine *suntem?*", echoing "Misiunea *noastră*" */}
              <div
                ref={headingRef}
                style={{
                  position: "absolute",
                  left: 0,
                  top: "8.5%",
                  fontFamily: FONT,
                  fontWeight: 500,
                  fontSize: "clamp(40px, 5.3vw, 104px)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.03em",
                  color: INK,
                }}
              >
                {t.goalTitle.split(" ")[0]}{" "}
                <span style={{ fontFamily: serifFont, fontStyle: "italic", fontWeight: 500, fontSize: "1.08em", lineHeight: 0.8, WebkitTextStrokeWidth: "0.017em", WebkitTextStrokeColor: "currentcolor" }}>
                  {t.goalTitle.split(" ").slice(1).join(" ")}
                </span>
              </div>
              {/* Image area (position/height auto-balanced in measure): ONE tall photo
                  sliced into 4 equal strips. Each strip clips its quarter of the SAME
                  image (offset by -k·(strip+gap)), so together they reconstruct the
                  full picture with the 12px gaps reading as cuts through it. Each strip
                  still POPS in top→bottom; the shared photo parallaxes behind the gaps.
                  Two stacked copies per strip (A/B) double-buffer the slideshow: the
                  incoming photo scan-line-wipes over the current one (driver above).
                  Geometry: img height = 4 strips (400%) + 3 gaps (36px) + 72px parallax
                  headroom; base top centres that ±36px overscan. */}
              <div
                ref={collageAreaRef}
                style={{ position: "absolute", left: 0, top: "24%", width: "100%", height: "72%" }}
              >
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[0, 1, 2, 3].map((k) => {
                    const sliceStyle: CSSProperties = {
                      position: "absolute",
                      left: 0,
                      top: `calc(${-k * 100}% - ${k * 12 + 36}px)`,
                      width: "100%",
                      height: "calc(400% + 108px)",
                      objectFit: "cover",
                      display: "block",
                      willChange: "transform",
                    };
                    return (
                      <div
                        key={k}
                        ref={(el) => {
                          imgsRef.current[k] = el;
                        }}
                        style={{
                          position: "relative",
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
                        {/* eslint-disable-next-line @next/next/no-img-element -- slice of a full-bleed art layer, sized by the strip */}
                        <img
                          ref={(el) => {
                            sliceImgsARef.current[k] = el;
                          }}
                          src={CINE_IMAGES[0]}
                          alt={k === 0 ? t.collage(1) : ""}
                          style={{ ...sliceStyle, zIndex: 1 }}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element -- slideshow back-buffer (also preloads image #2) */}
                        <img
                          ref={(el) => {
                            sliceImgsBRef.current[k] = el;
                          }}
                          src={CINE_IMAGES[1]}
                          alt=""
                          style={{ ...sliceStyle, zIndex: 2, clipPath: "inset(0 0 100% 0)" }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── RIGHT HALF: the big chunk fills the column; reveals in reading order ── */}
            <div style={{ position: "absolute", left: "49.5%", top: 0, width: "48.5%", height: "100%" }}>
              {/* the chunk in the hero's sans: Inter Tight 500, tight -0.03em, airier rows */}
              <div
                ref={chunkRef}
                style={{
                  position: "absolute",
                  left: 0,
                  top: "8.5%",
                  width: "100%",
                  fontFamily: FONT,
                  fontWeight: 500,
                  fontSize: "clamp(40px, 5.3vw, 104px)",
                  lineHeight: 1.14,
                  letterSpacing: "-0.03em",
                  color: INK,
                }}
              >
                {paragraphNodes}
              </div>
              {/* "Mai multe" — placeholder for the full company story (hero-CTA geometry,
                  coral fill so it reads on the white panel). */}
              <button
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: "2.5%",
                  appearance: "none",
                  border: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  background: ACCENT,
                  color: "#ffffff",
                  borderRadius: "3px",
                  padding: "11px 20px",
                  fontFamily: FONT,
                  fontSize: "1.04vw",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  whiteSpace: "nowrap",
                }}
              >
                {t.aboutMore}
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}>
                  <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
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
      id="rezultate"
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
