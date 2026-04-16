import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

const baseButtonStyle: React.CSSProperties = {
  background: "#334155",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {},
  secondary: {
    background: "#fff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  danger: {
    background: "#fff1f2",
    color: "#be123c",
    border: "1px solid #fecaca",
  },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{ ...baseButtonStyle, ...variantStyles[variant], ...style }}
    >
      {children}
    </button>
  );
}
