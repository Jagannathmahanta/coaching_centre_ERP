// ─────────────────────────────────────────────────────────────
// ExamUI.jsx  –  shared tiny UI components
// ─────────────────────────────────────────────────────────────
import React from "react";

// ─── Icon ────────────────────────────────────────────────────
const PATHS = {
  close:   "M18 6L6 18M6 6l12 12",
  check:   "M20 6L9 17l-5-5",
  plus:    "M12 5v14M5 12h14",
  trash:   "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  clock:   "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l3 3",
  list:    "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  trophy:  "M8 21h8M12 17v4M17 5H7l1 8a4 4 0 0 0 8 0l1-8zM3 5h18M6 5V3M18 5V3",
  warning: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  arrow:   "M5 12h14M12 5l7 7-7 7",
  flag:    "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  back:    "M19 12H5M12 19l-7-7 7-7",
};

export const Icon = ({ name, size = 18 }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
  >
    <path d={PATHS[name] || ""} />
  </svg>
);

// ─── Button ──────────────────────────────────────────────────
export const Btn = ({
  children, onClick, color = "#334155",
  ghost = false, danger = false, sm = false,
  disabled = false, fullWidth = false, style: sx = {},
}) => {
  const bg    = ghost ? "transparent" : danger ? "#ef4444" : disabled ? "#e5e7eb" : color;
  const fg    = ghost ? color : disabled ? "#9ca3af" : "#fff";
  const bc    = ghost ? color : danger ? "#ef4444" : disabled ? "#e5e7eb" : color;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: sm ? "7px 14px" : "10px 20px",
        background: bg, color: fg,
        border: `2px solid ${bc}`,
        borderRadius: 10, fontWeight: 700,
        fontSize: sm ? 13 : 14, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        transition: "opacity 0.15s",
        width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
        opacity: disabled ? 0.6 : 1,
        ...sx,
      }}
    >
      {children}
    </button>
  );
};

// ─── Badge ───────────────────────────────────────────────────
export const Badge = ({ children, color = "#4f46e5" }) => (
  <span style={{
    background: color + "20", color,
    padding: "3px 10px", borderRadius: 20,
    fontSize: 12, fontWeight: 700,
    display: "inline-block",
  }}>
    {children}
  </span>
);

// ─── Modal ───────────────────────────────────────────────────
export const Modal = ({ title, onClose, children, wide = false }) => (
  <div style={{
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 3000,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  }}>
    <div style={{
      background: "#fff", borderRadius: 20,
      padding: 32, width: "100%",
      maxWidth: wide ? 820 : 560,
      maxHeight: "92vh", overflowY: "auto",
      boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 24,
      }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "#f3f4f6", border: "none",
            borderRadius: 8, padding: 7,
            cursor: "pointer", color: "#666",
          }}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Field ───────────────────────────────────────────────────
export const Field = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && (
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700,
        color: "#666", marginBottom: 5,
        textTransform: "uppercase", letterSpacing: 0.4,
      }}>
        {label}
      </label>
    )}
    {props.type === "select" ? (
      <select
        {...props} type={undefined}
        style={{
          width: "100%", padding: "9px 12px",
          borderRadius: 9, border: "1.5px solid #e0e7ff",
          fontSize: 14, background: "#fafafa",
          outline: "none", color: "#333",
        }}
      >
        {props.children}
      </select>
    ) : props.type === "textarea" ? (
      <textarea
        {...props} type={undefined}
        rows={props.rows || 3}
        style={{
          width: "100%", padding: "9px 12px",
          borderRadius: 9, border: "1.5px solid #e0e7ff",
          fontSize: 14, resize: "vertical",
          outline: "none", background: "#fafafa",
          fontFamily: "inherit", boxSizing: "border-box",
        }}
      />
    ) : (
      <input
        {...props}
        style={{
          width: "100%", padding: "9px 12px",
          borderRadius: 9, border: "1.5px solid #e0e7ff",
          fontSize: 14, background: "#fafafa",
          outline: "none", boxSizing: "border-box",
          color: "#333",
        }}
      />
    )}
  </div>
);

// ─── Stat Card ───────────────────────────────────────────────
export const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: "#fff", borderRadius: 14,
    padding: "18px 20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    display: "flex", alignItems: "center",
    gap: 14, borderLeft: `4px solid ${color}`,
  }}>
    <div style={{
      background: color + "18", borderRadius: 10,
      padding: 12, color,
    }}>
      <Icon name={icon} size={22} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#1a1a2e" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  </div>
);
