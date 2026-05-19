import type { ReactNode } from "react";

interface Props {
  variant?: "default" | "surprised" | "thinking";
  size?: number;
  className?: string;
  children?: ReactNode;
}

export default function Mascot({ variant = "default", size = 48, className = "", children }: Props) {
  const svgMap = {
    default: "/mascot.svg",
    surprised: "/mascot-surprised.svg",
    thinking: "/mascot-thinking.svg",
  };

  return (
    <span className={`mascot-wrap ${className}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", verticalAlign: "middle" }}>
      <img
        src={svgMap[variant]}
        alt="Nerdy engineer mascot"
        width={size}
        height={size}
        className="mascot-img"
        style={{ display: "inline-block" }}
      />
      {children && <span className="mascot-text">{children}</span>}
    </span>
  );
}
