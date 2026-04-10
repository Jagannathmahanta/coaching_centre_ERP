import type { StudentLoginDraft } from "../types/students.types";
import { sanitizeEmailInput, sanitizePhoneInput } from "../../../shared/utils/contact";

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
};

const emptyDraft: StudentLoginDraft = {
  open: false,
  studentId: 0,
  studentName: "",
  email: "",
  phone: "",
  password: "",
};

export default function CreateLoginModal({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: StudentLoginDraft;
  setDraft: React.Dispatch<React.SetStateAction<StudentLoginDraft>>;
  onSubmit: () => void;
}) {
  if (!draft.open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.5)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        zIndex: 1000,
      }}
      onClick={() => setDraft(emptyDraft)}
    >
      <div style={{ ...cardStyle, width: 560 }} onClick={(event) => event.stopPropagation()}>
        <h2 style={{ margin: 0 }}>Create Student Login</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>Create a linked login account for {draft.studentName}.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          <label style={{ color: "#374151", fontWeight: 700 }}>
            Email
            <input
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: sanitizeEmailInput(event.target.value) }))}
              type="email"
              placeholder="name@example.com"
              style={{ ...inputStyle, marginTop: 6 }}
            />
          </label>
          <label style={{ color: "#374151", fontWeight: 700 }}>
            Mobile
            <input
              value={draft.phone}
              onChange={(event) => setDraft((current) => ({ ...current, phone: sanitizePhoneInput(event.target.value) }))}
              inputMode="numeric"
              maxLength={10}
              placeholder="10 digit mobile"
              style={{ ...inputStyle, marginTop: 6 }}
            />
          </label>
        </div>
        <label style={{ color: "#374151", fontWeight: 700, display: "block", marginTop: 14 }}>
          Password
          <input
            type="password"
            value={draft.password}
            onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
            style={{ ...inputStyle, marginTop: 6 }}
          />
        </label>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 18 }}>
          <button
            type="button"
            onClick={() => setDraft(emptyDraft)}
            style={{
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Create Login
          </button>
        </div>
      </div>
    </div>
  );
}
