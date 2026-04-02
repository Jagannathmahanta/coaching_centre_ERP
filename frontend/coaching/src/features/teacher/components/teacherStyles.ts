export const cardStyle = {
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

export const inputStyle = {
  width: "90%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
};

export const buttonStyle = {
  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

export const secondaryButton = {
  ...buttonStyle,
  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
  color: "#fff",
};

export const dangerButton = {
  ...buttonStyle,
  background: "#fff1f2",
  color: "#be123c",
};

export const pickerStyle = {
  marginTop: 6,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: 14,
  display: "grid",
  gap: 10,
  background: "#fff",
};

export const pickerGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};
