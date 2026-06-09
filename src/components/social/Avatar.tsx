"use client";

import type React from "react";

export function Avatar({ initials, color, size = 40, image, style }: {
  initials?: string; color?: string; size?: number; image?: string; style?: React.CSSProperties;
}) {
  if (image) return (
    <img src={image} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, ...style }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color || "hsl(var(--primary))",
      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
      fontSize: size * 0.3, fontWeight: 700, flexShrink: 0, ...style,
    }}>{initials || "?"}</div>
  );
}
