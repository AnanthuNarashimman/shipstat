import { ImageResponse } from "next/og";

// Home-screen icon for iOS: the logo mark on a full-bleed square (iOS rounds the corners itself).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const bar = (left: number, top: number, height: number, background: string, opacity = 1) => (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 25,
        height,
        borderRadius: 7,
        background,
        opacity,
      }}
    />
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#231a15" }}>
        {bar(39, 96, 45, "#fffaf5", 0.55)}
        {bar(77, 70, 71, "#fffaf5", 0.85)}
        {bar(116, 39, 102, "#ff8a3d")}
      </div>
    ),
    size,
  );
}
