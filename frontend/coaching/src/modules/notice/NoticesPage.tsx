import { useEffect, useMemo, useState } from "react";
import api from "../../shared/services/api";
import { useAuth } from "../../shared/hooks/AuthContext";
import { getUser } from "../../shared/services/auth";
import type { CatalogBatch, CatalogBootstrap, CatalogClass, CatalogCourse, CatalogProgramType } from "../../shared/types/catalog";

type NoticeAudience = "all" | "students" | "parents" | "teachers";
type NoticeScope = "all" | "filtered";

type NoticeItem = {
  id: number;
  title: string;
  content: string;
  target_audience?: string | null;
  target_scope?: string | null;
  program_type?: CatalogProgramType | null;
  class_id?: number | null;
  course_id?: number | null;
  batch_id?: number | null;
  class_label?: string | null;
  course_label?: string | null;
  batch_name?: string | null;
  priority?: string | null;
  expires_at?: string | null;
  created_at: string;
};

type NoticeFormState = {
  title: string;
  content: string;
  target_audience: NoticeAudience;
  target_scope: NoticeScope;
  program_type: CatalogProgramType;
  class_id: string;
  course_id: string;
  batch_id: string;
  priority: "high" | "medium" | "low";
  expires_at: string;
};

const cardStyle = {
  background: "#fff",
  borderRadius: 20,
  padding: 22,
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
  boxSizing: "border-box" as const,
};

const initialForm: NoticeFormState = {
  title: "",
  content: "",
  target_audience: "students",
  target_scope: "all",
  program_type: "academic",
  class_id: "",
  course_id: "",
  batch_id: "",
  priority: "medium",
  expires_at: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 700, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

function formatTarget(notice: NoticeItem) {
  if ((notice.target_scope || "all") === "all") {
    return "All";
  }

  if (notice.program_type === "academic") {
    const classText = notice.class_label || "Selected class";
    return notice.batch_name ? `${classText} • ${notice.batch_name}` : classText;
  }

  const courseText = notice.course_label || "Selected course";
  return notice.batch_name ? `${courseText} • ${notice.batch_name}` : courseText;
}

export default function NoticesPage() {
  const { profile } = useAuth();
  const role = (profile?.role ?? getUser()?.role ?? "").toLowerCase();
  const canManage = role === "admin" || role === "staff";

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogBootstrap>({ classes: [], courses: [], batches: [] });
  const [form, setForm] = useState<NoticeFormState>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPage = async () => {
    setLoading(true);
    setError("");
    try {
      const requests = canManage
        ? Promise.all([api.get("/notices"), api.get("/catalog/bootstrap")])
        : Promise.all([api.get("/notices"), Promise.resolve({ data: { classes: [], courses: [], batches: [] } })]);
      const [noticesRes, catalogRes] = await requests;
      setNotices(noticesRes.data || []);
      setCatalog((catalogRes.data || { classes: [], courses: [], batches: [] }) as CatalogBootstrap);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const filteredBatches = useMemo(() => {
    if (form.program_type === "academic") {
      return (catalog.batches || []).filter(
        (batch) => batch.program_type === "academic" && String(batch.class_id || "") === form.class_id
      );
    }

    return (catalog.batches || []).filter(
      (batch) => batch.program_type === "non_academic" && String(batch.course_id || "") === form.course_id
    );
  }, [catalog.batches, form.class_id, form.course_id, form.program_type]);

  const handlePublish = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await api.post("/notices", {
        title: form.title,
        content: form.content,
        target_audience: form.target_audience,
        target_scope: form.target_scope,
        program_type: form.target_scope === "filtered" ? form.program_type : undefined,
        class_id: form.target_scope === "filtered" && form.program_type === "academic" ? Number(form.class_id) : undefined,
        course_id: form.target_scope === "filtered" && form.program_type === "non_academic" ? Number(form.course_id) : undefined,
        batch_id: form.target_scope === "filtered" && form.batch_id ? Number(form.batch_id) : undefined,
        priority: form.priority,
        expires_at: form.expires_at || undefined,
      });

      setMessage("Notice published.");
      setForm(initialForm);
      setShowForm(false);
      await loadPage();
    } catch (saveError: any) {
      setError(saveError.response?.data?.error || "Failed to publish notice.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noticeId: number) => {
    if (!window.confirm("Delete this notice?")) return;
    setMessage("");
    setError("");
    try {
      await api.delete(`/notices/${noticeId}`);
      setMessage("Notice deleted.");
      await loadPage();
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.error || "Failed to delete notice.");
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Notice Module</h1>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Publish notices for everyone or for a specific class / course / batch group. If you want to send it to all, just choose <strong>Target Scope = All</strong>.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #9333ea)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {showForm ? "Close Form" : "Create Notice"}
          </button>
        ) : null}
      </div>

      {message ? <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{message}</div> : null}
      {error ? <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{error}</div> : null}

      {showForm && canManage ? (
        <section style={cardStyle}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0 }}>Publish Notice</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              Use <strong>All</strong> for center-wide notices. Use <strong>Specific Group</strong> only when the notice belongs to a selected class / course / batch.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <Field label="Title">
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} style={inputStyle} />
            </Field>

            <Field label="Audience">
              <select value={form.target_audience} onChange={(event) => setForm((current) => ({ ...current, target_audience: event.target.value as NoticeAudience }))} style={inputStyle}>
                <option value="all">All</option>
                <option value="students">Students</option>
                <option value="parents">Parents</option>
                <option value="teachers">Teachers</option>
              </select>
            </Field>

            <Field label="Target Scope">
              <select
                value={form.target_scope}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    target_scope: event.target.value as NoticeScope,
                    class_id: "",
                    course_id: "",
                    batch_id: "",
                  }))
                }
                style={inputStyle}
              >
                <option value="all">All</option>
                <option value="filtered">Specific Group</option>
              </select>
            </Field>

            <Field label="Priority">
              <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as NoticeFormState["priority"] }))} style={inputStyle}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field label="Description">
              <textarea
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" as const }}
              />
            </Field>
          </div>

          <div style={{ marginTop: 14, maxWidth: 260 }}>
            <Field label="Expire On">
              <input type="date" value={form.expires_at} onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))} style={inputStyle} />
            </Field>
          </div>

          {form.target_scope === "filtered" ? (
            <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <Field label="Program">
                  <select
                    value={form.program_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        program_type: event.target.value as CatalogProgramType,
                        class_id: "",
                        course_id: "",
                        batch_id: "",
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="academic">Academic</option>
                    <option value="non_academic">Non-Academic</option>
                  </select>
                </Field>

                {form.program_type === "academic" ? (
                  <Field label="Class">
                    <select value={form.class_id} onChange={(event) => setForm((current) => ({ ...current, class_id: event.target.value, batch_id: "" }))} style={inputStyle}>
                      <option value="">Choose class</option>
                      {(catalog.classes || []).map((item: CatalogClass) => (
                        <option key={item.id} value={item.id}>{item.class_name}</option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="Course">
                    <select value={form.course_id} onChange={(event) => setForm((current) => ({ ...current, course_id: event.target.value, batch_id: "" }))} style={inputStyle}>
                      <option value="">Choose course</option>
                      {(catalog.courses || []).map((item: CatalogCourse) => (
                        <option key={item.id} value={item.id}>{item.course_name}</option>
                      ))}
                    </select>
                  </Field>
                )}

                <Field label="Batch (Optional)">
                  <select value={form.batch_id} onChange={(event) => setForm((current) => ({ ...current, batch_id: event.target.value }))} style={inputStyle}>
                    <option value="">All matching batches</option>
                    {filteredBatches.map((batch: CatalogBatch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_name}
                        {batch.shift ? ` • ${batch.shift}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 700,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Publishing..." : "Publish Notice"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setShowForm(false);
              }}
              style={{
                background: "#f3f4f6",
                color: "#111827",
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <section style={cardStyle}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Published Notices</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            {canManage ? "All published notices for this center." : "Notices available to your account."}
          </p>
        </div>

        {loading ? (
          <div style={{ color: "#6b7280" }}>Loading notices...</div>
        ) : notices.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No notices published yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {notices.map((notice) => (
              <div key={notice.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{notice.title}</h3>
                    <div style={{ color: "#64748b", marginTop: 6 }}>
                      Posted on {new Date(notice.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: "#ede9fe", color: "#6d28d9", fontWeight: 700, fontSize: 12 }}>
                      {notice.priority || "medium"}
                    </span>
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 12 }}>
                      {(notice.target_audience || "all").replace("_", " ")}
                    </span>
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: "#ecfeff", color: "#0f766e", fontWeight: 700, fontSize: 12 }}>
                      {formatTarget(notice)}
                    </span>
                  </div>
                </div>

                <p style={{ color: "#334155", marginTop: 14, marginBottom: 0 }}>{notice.content}</p>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    {notice.expires_at ? `Expires on ${new Date(notice.expires_at).toLocaleDateString()}` : "No expiry"}
                  </div>

                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(notice.id)}
                      style={{
                        background: "#fff1f2",
                        color: "#be123c",
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
