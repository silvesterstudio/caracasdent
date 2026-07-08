import type { Metadata } from "next";
import { Nunito, Instrument_Serif } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

// Nunito — the brandbook's endorsed web font (covers Latin + Cyrillic for RO/RU).
// (The primary "Avoidance Genevra" display font isn't freely available; Nunito is
// the brandbook's named alternative.)
const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-nunito",
  display: "swap",
});

// Instrument Serif — used for Romanian (Latin only). Russian falls back to
// Georgia (a system serif with Cyrillic) via the component's per-language font.
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
    <html lang="ro" className={`${nunito.variable} ${instrument.variable}`}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
