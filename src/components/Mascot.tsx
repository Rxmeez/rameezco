import type { ReactNode } from "react";
import { MascotDefaultSvg, MascotSurprisedSvg, MascotThinkingSvg } from "./MascotSvg";

interface Props {
  variant?: "default" | "surprised" | "thinking";
  size?: number;
  animated?: boolean;
  className?: string;
  children?: ReactNode;
}

const SvgMap = {
  default: MascotDefaultSvg,
  surprised: MascotSurprisedSvg,
  thinking: MascotThinkingSvg,
};

export default function Mascot({ variant = "default", size = 48, animated = false, className = "", children }: Props) {
  const animationClass = animated ? `mascot-animated-${variant}` : "";
  const Svg = SvgMap[variant];

  return (
    <span className={`mascot-wrap ${className}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", verticalAlign: "middle" }}>
      <Svg width={size} height={size} className={`mascot-img ${animationClass}`} style={{ display: "inline-block" }} />
      {children && <span className="mascot-text">{children}</span>}
    </span>
  );
}
