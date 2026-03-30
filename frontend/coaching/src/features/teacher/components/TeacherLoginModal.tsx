import { buttonStyle, cardStyle, inputStyle, secondaryButton } from "./teacherStyles";
import { Field } from "./TeacherShared";
import type { TeacherLoginDraft } from "../types/teacher.types";

export function TeacherLoginModal({
  draft,
  setDraft,
  onSubmit,
  isPending,
}: {
  draft: TeacherLoginDraft;
  setDraft: React.Dispatch<React.SetStateAction<TeacherLoginDraft>>;
  onSubmit: () => void;
  isPending: boolean;
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
      onClick={() => setDraft({ open: false, teacherId: 0, teacherName: "", email: "", phone: "", password: "" })}
    >
      <div style={{ ...cardStyle, width: "min(560px, 100%)" }} onClick={(event) => event.stopPropagation()}>
        <h2 style={{ margin: 0 }}>Create Teacher Login</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>Create a linked login account for {draft.teacherName}.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          <Field label="Email">
            <input value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Mobile">
            <input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} style={inputStyle} />
          </Field>
        </div>
        <Field label="Password">
          <input type="password" value={draft.password} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} style={inputStyle} />
        </Field>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 18 }}>
          <button
            type="button"
            style={secondaryButton}
            onClick={() => setDraft({ open: false, teacherId: 0, teacherName: "", email: "", phone: "", password: "" })}
          >
            Cancel
          </button>
          <button type="button" style={buttonStyle} onClick={onSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Create Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
