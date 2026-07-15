import type { Metadata } from "next";
import { Inter_Tight, Instrument_Serif } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

// Inter Tight — the site's sans, used for ALL UI / body / labels and the hero's
// main display line ("Dinții tăi, Misiunea …"). Covers Latin + Cyrillic (RO/RU).
const interTight = Inter_Tight({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-inter-tight",
  display: "swap",
});

// Instrument Serif — the FALLBACK editorial serif. The design calls for
// "PP Editorial New" (a commercial face, self-hosted via @font-face in
// globals.css); until that file is present the editorial words render in
// Instrument Serif, which shares the same high-contrast editorial character.
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Caracaș Dental — Dinții tăi, misiunea noastră",
  description:
    "Clinică stomatologică în Chișinău, cu peste 25 de ani de experiență. Grijă, încredere și zâmbete sănătoase pentru fiecare generație.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className={`${interTight.variable} ${instrument.variable}`}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
