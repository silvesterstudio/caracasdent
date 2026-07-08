import type { CSSProperties } from "react";

/**
 * ImageSlot — production stand-in for the design's <image-slot> placeholder.
 *
 * The original handoff used a drag-and-drop <image-slot> custom element whose
 * job was purely design-tool authoring (persisting dropped photos to a sidecar
 * JSON). None of that machinery belongs in the shipped site, so this component
 * keeps only what matters: it fills its (sized, positioned) parent and shows
 * either a real photo (`src`) or a subtle, intentional placeholder panel.
 *
 * Swap in real art later by passing `src` — the layout is identical either way.
 */
export type ImageSlotProps = {
  src?: string;
  alt?: string;
  /** Placeholder fill colour (matches the design's per-slot background). */
  bg?: string;
  /** Faint caption shown while the slot is empty. */
  label?: string;
  /** Use light placeholder text (for dark slots). */
  dark?: boolean;
  style?: CSSProperties;
};

export default function ImageSlot({
  src,
  alt = "",
  bg = "#c9d2d2",
  label,
  dark = false,
  style,
}: ImageSlotProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        position: "relative",
        overflow: "hidden",
        background: bg,
        ...style,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- full-bleed art layers, sized by the parent
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : label ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "16px",
            fontFamily: "var(--font-nunito), sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: dark ? "rgba(234,240,255,0.40)" : "rgba(28,43,48,0.38)",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}
