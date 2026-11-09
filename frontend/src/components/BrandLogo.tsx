import React from "react";

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  variant?: "dark" | "light";
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 36,
  showWordmark = true,
  variant = "dark",
  className = "",
}) => {
  return (
    <div
      className={`brand-lockup ${variant} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        userSelect: "none",
        minWidth: 0,
      }}
    >
      {/* Geometric Isometric Inventory Box with Detection Reticle */}
      <div
        className="brand-icon-box"
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: "9px",
          background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            variant === "dark"
              ? "0 2px 8px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)"
              : "0 2px 6px rgba(99, 102, 241, 0.2)",
          flexShrink: 0,
        }}
      >
        <svg
          width={Math.round(size * 0.58)}
          height={Math.round(size * 0.58)}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Isometric Box Outline */}
          <path
            d="M12 2.2L20.5 7.1V16.9L12 21.8L3.5 16.9V7.1L12 2.2Z"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Isometric Inner Vertex Edges */}
          <path
            d="M12 12V21.8M12 12L20.5 7.1M12 12L3.5 7.1"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeOpacity="0.85"
          />
          {/* Precision Detection Audit Center */}
          <circle cx="12" cy="12" r="2.2" fill="#38bdf8" />
          <circle cx="12" cy="12" r="0.9" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography: Exactly 2 clean, un-wrapped lines */}
      {showWordmark && (
        <div
          className="brand-text-container"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 0,
            lineHeight: 1.18,
          }}
        >
          <span
            className="brand-title-text"
            style={{
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: variant === "dark" ? "#ffffff" : "#0f172a",
              whiteSpace: "nowrap",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Smart Inventory
          </span>
          <span
            className="brand-subtitle-text"
            style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.015em",
              color: variant === "dark" ? "#94a3b8" : "#64748b",
              whiteSpace: "nowrap",
              marginTop: "2px",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Loss Detection &amp; Investigation
          </span>
        </div>
      )}
    </div>
  );
};

