import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "StudyPilot — Révise mieux avec l'IA";
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
          background: "#0a0a12",
          padding: "80px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            📚
          </div>
          <span style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>StudyPilot</span>
        </div>

        <h1
          style={{
            fontSize: "60px",
            fontWeight: "700",
            color: "#fff",
            lineHeight: 1.1,
            margin: "0 0 24px",
            maxWidth: "900px",
            letterSpacing: "-0.03em",
          }}
        >
          Transforme tes cours en{" "}
          <span style={{ color: "#8B5CF6" }}>flashcards & quiz</span>
        </h1>

        <p style={{ fontSize: "24px", color: "#888", margin: 0, maxWidth: "700px", lineHeight: 1.5 }}>
          L'IA génère tes fiches de révision en quelques secondes.
        </p>

        <div style={{ display: "flex", gap: "24px", marginTop: "56px" }}>
          {[
            { label: "Flashcards", value: "Auto", blue: true },
            { label: "Quiz QCM", value: "Illimités" },
            { label: "Prof IA", value: "24h/7j", purple: true },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                background: s.blue ? "#3B82F6" : s.purple ? "#8B5CF6" : "#111",
                border: "1px solid " + (s.blue ? "#3B82F6" : s.purple ? "#8B5CF6" : "#222"),
                borderRadius: "12px",
                padding: "16px 24px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: s.blue || s.purple ? "rgba(255,255,255,0.7)" : "#666",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                {s.label}
              </span>
              <span style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
