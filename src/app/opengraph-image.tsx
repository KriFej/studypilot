import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "locpilote — tableau de bord de rentabilité Airbnb & Booking";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0a0a0a",
          padding: "80px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Green accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #16a34a, #22c55e)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "#22c55e",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "700",
              color: "#000",
            }}
          >
            L
          </div>
          <span style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>
            locpilote
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: "700",
            color: "#fff",
            lineHeight: 1.1,
            margin: "0 0 24px",
            maxWidth: "900px",
            letterSpacing: "-0.03em",
          }}
        >
          Savez-vous vraiment{" "}
          <span style={{ color: "#22c55e" }}>ce que vous gagnez ?</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "24px",
            color: "#888",
            margin: 0,
            maxWidth: "700px",
            lineHeight: 1.5,
          }}
        >
          Le tableau de bord de rentabilité pour les hôtes Airbnb & Booking.com.
        </p>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "56px",
          }}
        >
          {[
            { label: "Revenus bruts", value: "4 500 €" },
            { label: "Dépenses", value: "620 €" },
            { label: "Bénéfice net", value: "3 195 €", green: true },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                background: s.green ? "#22c55e" : "#111",
                border: "1px solid " + (s.green ? "#22c55e" : "#222"),
                borderRadius: "12px",
                padding: "16px 24px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: s.green ? "#000" : "#666",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: s.green ? "#000" : "#fff",
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
