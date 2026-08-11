import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const FELT = "#0E3A2B";
const FELT_DARK = "#092A20";
const GOLD = "#C4A962";
const CREAM = "#F5F0E8";
const SUIT_RED = "#E2564E";
const SUIT_BLACK = "#D9D2C4";

const FONT = "Geist, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

function SuitCard({
  suit,
  color,
  rank,
  delay = 0,
}: {
  suit: string;
  color: string;
  rank: string;
  delay?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 150,
        height: 210,
        borderRadius: 18,
        background: "#F7F2E7",
        boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
        border: "6px solid rgba(196,169,98,0.35)",
        marginLeft: delay === 0 ? 0 : -86,
        zIndex: 10 - delay,
      }}
    >
      <div style={{ display: "flex", fontSize: 62, fontWeight: 700, color, lineHeight: 1 }}>
        {rank}
      </div>
      <div style={{ display: "flex", fontSize: 74, color, lineHeight: 1, marginTop: 6 }}>
        {suit}
      </div>
    </div>
  );
}

export function buildOgImage({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 85% 12%, ${GOLD}22, transparent 42%), linear-gradient(160deg, ${FELT} 0%, ${FELT_DARK} 100%)`,
          fontFamily: FONT,
          color: CREAM,
          padding: "72px 96px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", marginBottom: 44 }}>
          <SuitCard suit="♠" color={SUIT_BLACK} rank="A" delay={0} />
          <SuitCard suit="♥" color={SUIT_RED} rank="K" delay={1} />
          <SuitCard suit="♦" color={SUIT_RED} rank="Q" delay={2} />
          <SuitCard suit="♣" color={SUIT_BLACK} rank="J" delay={3} />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            textAlign: "center",
            color: CREAM,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 500,
            textAlign: "center",
            color: GOLD,
            marginTop: 18,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    { width: OG_SIZE.width, height: OG_SIZE.height }
  );
}
