type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

export default function Button({
  children,
  onClick,
  variant = "primary",
}: Props) {
  const style = {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: variant === "primary" ? "#2563eb" : "#e5e7eb",
    color: variant === "primary" ? "#fff" : "#000",
  };

  return (
    <button onClick={onClick} style={style}>
      {children}
    </button>
  );
}