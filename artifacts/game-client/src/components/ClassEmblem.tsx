import type { CSSProperties } from "react";
import { getClassColors } from "@workspace/game-data";

export type ClassEmblemState = "unlocked" | "locked" | "fallen";
export type SigilCorner = "tr" | "tl" | "br" | "bl";

export interface ClassEmblemProps {
  classId: string;
  state?: ClassEmblemState;
  size?: number;
  showSigil?: boolean;
  sigilCorner?: SigilCorner;
  sigilSize?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

const CORNER_STYLES: Record<SigilCorner, CSSProperties> = {
  tr: { top: "4%", right: "4%" },
  tl: { top: "4%", left: "4%" },
  br: { bottom: "4%", right: "4%" },
  bl: { bottom: "4%", left: "4%" },
};

export function ClassEmblem({
  classId,
  state = "unlocked",
  size = 96,
  showSigil = true,
  sigilCorner = "tr",
  sigilSize,
  className,
  style,
  ariaLabel,
}: ClassEmblemProps) {
  const colors = getClassColors(classId);
  const silhouetteUrl = `/assets/units/${classId}-silhouette.svg`;
  const sigilUrl = `/assets/units/${classId}-sigil.svg`;
  const resolvedSigilSize = sigilSize ?? Math.round(size * 0.32);

  let silhouetteBg: string;
  let silhouetteOpacity = 1;
  if (state === "unlocked") {
    silhouetteBg = colors.primary;
  } else if (state === "locked") {
    silhouetteBg = "#aab2c2";
    silhouetteOpacity = 0.5;
  } else {
    silhouetteBg = colors.primary;
    silhouetteOpacity = 0.35;
  }

  const sigilOpacity =
    !showSigil ? 0 :
    state === "locked" ? 0 :
    state === "fallen" ? 0.4 :
    1;

  const maskStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: silhouetteBg,
    opacity: silhouetteOpacity,
    WebkitMask: `url(${silhouetteUrl}) center / contain no-repeat`,
    mask: `url(${silhouetteUrl}) center / contain no-repeat`,
    filter: state === "fallen" ? "saturate(0.5)" : undefined,
  };

  const sigilStyle: CSSProperties = {
    position: "absolute",
    width: resolvedSigilSize,
    height: resolvedSigilSize,
    objectFit: "contain",
    opacity: sigilOpacity,
    pointerEvents: "none",
    filter: state === "fallen" ? "saturate(0.6)" : undefined,
    ...CORNER_STYLES[sigilCorner],
  };

  return (
    <div
      className={className}
      role="img"
      aria-label={ariaLabel ?? `${classId} emblem`}
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    >
      <div style={maskStyle} aria-hidden />
      {showSigil && state !== "locked" && (
        <img src={sigilUrl} alt="" aria-hidden style={sigilStyle} />
      )}
    </div>
  );
}

export default ClassEmblem;
