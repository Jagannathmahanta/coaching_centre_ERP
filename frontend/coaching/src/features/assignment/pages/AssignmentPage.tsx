import { useEffect, useMemo, useState, type CSSProperties } from "react";
import api from "../../../shared/services/api";
import { useAuth } from "../../../shared/hooks/AuthContext";
import { getUser, isStaffTeacher } from "../../../shared/services/auth";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import type { CatalogBootstrap } from "../../../shared/types/catalog";
import Content from "../../../assets/Content.png";
import "../../../shared/styles/dataTable.css";
import { Button } from "../../../shared/components/Button";

type AssignmentTargetType = "class" | "student";

type AssignmentRecord = {
  id: number;
  title: string;
  description: string;
  target_type: AssignmentTargetType;
  class_id?: number | null;
  student_id?: number | null;
  due_date?: string | null;
  status: string;
  created_at: string;
  class_name?: string | null;
  student_name?: string | null;
  student_roll_number?: string | null;
  created_by_name?: string | null;
  attachment_name?: string | null;
  attachment_mime_type?: string | null;
  attachment_path?: string | null;
  attachment_url?: string | null;
};

type StudentOption = {
  id: number;
  name: string;
  class_id?: number | null;
  roll_number?: string | null;
  class_label?: string | null;
  status?: string | null;
};

type AssignmentFormState = {
  title: string;
  description: string;
  class_id: string;
  target_type: AssignmentTargetType;
  student_id: string;
  due_date: string;
  attachment: File | null;
  remove_attachment: boolean;
};

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
};

const tableCellStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left" as const,
  verticalAlign: "top" as const,
};

const tableHeadCellStyle = {
  ...tableCellStyle,
  whiteSpace: "nowrap" as const,
};

const compactCellStyle = {
  ...tableCellStyle,
  whiteSpace: "nowrap" as const,
};

const initialForm: AssignmentFormState = {
  title: "",
  description: "",
  class_id: "",
  target_type: "class",
  student_id: "",
  due_date: "",
  attachment: null,
  remove_attachment: false,
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AssignmentPage() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const user = profile ?? getUser();
  const role = user?.role ?? "";
  const canManage = role === "admin" || (role === "teacher" && !isStaffTeacher(user));
  const canView = canManage || role === "student";

  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [catalog, setCatalog] = useState<CatalogBootstrap>({ classes: [], courses: [], batches: [] });
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [form, setForm] = useState<AssignmentFormState>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeStudents = useMemo(
    () => students.filter((student) => (student.status || "active") === "active"),
    [students]
  );
  const classFilteredStudents = useMemo(
    () => activeStudents.filter((student) => String(student.class_id || "") === form.class_id),
    [activeStudents, form.class_id]
  );

  const attachmentBaseUrl = useMemo(() => {
    try {
      return new URL("/", import.meta.env.VITE_API_BASE_URL).toString().replace(/\/$/, "");
    } catch {
      return "";
    }
  }, []);

  const loadAssignments = async () => {
    const response = await api.get("/assignments");
    setAssignments(response.data || []);
  };

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const requests: Promise<any>[] = [api.get("/assignments")];
        if (canManage) {
          requests.push(api.get("/catalog/bootstrap"));
          requests.push(api.get("/students"));
        }

        const [assignmentsRes, catalogRes, studentsRes] = await Promise.all(requests);
        if (ignore) return;

        setAssignments(assignmentsRes.data || []);
        if (catalogRes) {
          setCatalog(catalogRes.data || { classes: [], courses: [], batches: [] });
        }
        if (studentsRes) {
          setStudents(studentsRes.data || []);
        }
      } catch (loadError: any) {
        if (!ignore) {
          setError(loadError?.response?.data?.error || "Failed to load assignments.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [canManage, canView]);

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read attachment."));
      reader.readAsDataURL(file);
    });

  const resetEditor = () => {
    setForm(initialForm);
    setShowForm(false);
    setEditingAssignmentId(null);
  };

  const buildPayload = async () => {
    let attachmentPayload;
    if (form.attachment) {
      if (form.attachment.size > 5 * 1024 * 1024) {
        throw new Error(t("assignment.attachmentTooLarge"));
      }
      attachmentPayload = {
        name: form.attachment.name,
        content: await readFileAsDataUrl(form.attachment),
      };
    }

    return {
      title: form.title,
      description: form.description,
      class_id: form.class_id ? Number(form.class_id) : undefined,
      target_type: form.target_type,
      student_id: form.target_type === "student" ? Number(form.student_id) : undefined,
      due_date: form.due_date || undefined,
      attachment: attachmentPayload,
      remove_attachment: form.remove_attachment || undefined,
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = await buildPayload();
      if (editingAssignmentId) {
        await api.put(`/assignments/${editingAssignmentId}`, payload);
      } else {
        await api.post("/assignments", payload);
      }

      await loadAssignments();
      resetEditor();
      setMessage(editingAssignmentId ? t("assignment.updated") : t("assignment.created"));
    } catch (saveError: any) {
      setError(saveError?.response?.data?.error || saveError?.message || "Failed to save assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (assignment: AssignmentRecord) => {
    setForm({
      title: assignment.title || "",
      description: assignment.description || "",
      class_id: assignment.class_id ? String(assignment.class_id) : "",
      target_type: assignment.target_type,
      student_id: assignment.student_id ? String(assignment.student_id) : "",
      due_date: assignment.due_date ? String(assignment.due_date).slice(0, 10) : "",
      attachment: null,
      remove_attachment: false,
    });
    setEditingAssignmentId(assignment.id);
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const handleDelete = async (assignmentId: number) => {
    if (!window.confirm(t("assignment.deleteConfirm"))) return;

    setDeletingId(assignmentId);
    setError("");
    setMessage("");

    try {
      await api.delete(`/assignments/${assignmentId}`);
      await loadAssignments();
      setMessage(t("assignment.deleted"));
    } catch (deleteError: any) {
      setError(deleteError?.response?.data?.error || "Failed to delete assignment.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!canView) {
    return <div style={cardStyle}>{t("assignment.noAccess")}</div>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>{t("assignment.pageTitle")}</h1>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            {canManage ? t("assignment.pageSub") : t("assignment.studentSub")}
          </p>
        </div>

        {canManage ? (
          <Button
            type="button"
            
            onClick={() => {
              if (showForm) {
                resetEditor();
                return;
              }
              setShowForm(true);
              setEditingAssignmentId(null);
              setForm(initialForm);
              setMessage("");
              setError("");
            }}
          >
            {showForm ? t("Back") : t("assignment.addAssignment")}
          </Button>
        ) : null}
      </div>

      {message ? <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{message}</div> : null}
      {error ? <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{error}</div> : null}

      {canManage && showForm ? (
        <section style={cardStyle}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0 }}>{editingAssignmentId ? t("assignment.editTitle") : t("assignment.createTitle")}</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>{t("assignment.createSub")}</p>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{t("assignment.titleLabel")}</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={t("assignment.titlePlaceholder")}
                style={inputStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{t("assignment.descriptionLabel")}</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder={t("assignment.descriptionPlaceholder")}
                style={textareaStyle}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{t("assignment.classLabel")}</span>
                <select
                  value={form.class_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      class_id: event.target.value,
                      student_id: "",
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="">{t("assignment.selectClass")}</option>
                  {catalog.classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.class_name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{t("assignment.targetTypeLabel")}</span>
                <select
                  value={form.target_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      target_type: event.target.value as AssignmentTargetType,
                      student_id: "",
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="class">{t("assignment.targetTypeClass")}</option>
                  <option value="student">{t("assignment.targetTypeStudent")}</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{t("assignment.dueDateLabel")}</span>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))}
                  style={inputStyle}
                />
              </label>
            </div>

            {form.target_type === "student" ? (
              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{t("assignment.studentLabel")}</span>
                <select
                  value={form.student_id}
                  onChange={(event) => setForm((current) => ({ ...current, student_id: event.target.value }))}
                  style={inputStyle}
                disabled={!form.class_id}
                >
                  <option value="">{t("assignment.selectStudent")}</option>
                  {classFilteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                      {student.roll_number ? ` • ${student.roll_number}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{t("assignment.attachmentLabel")}</span>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  setForm((current) => ({
                    ...current,
                    attachment: nextFile,
                    remove_attachment: nextFile ? false : current.remove_attachment,
                  }));
                }}
                style={inputStyle}
              />
              <span style={{ color: "#64748b", fontSize: 12 }}>{t("assignment.attachmentHint")}</span>
              {editingAssignmentId ? (
                <span style={{ color: "#64748b", fontSize: 12 }}>
                  {(() => {
                    const currentAssignment = assignments.find((item) => item.id === editingAssignmentId);
                    if (!currentAssignment?.attachment_name && !currentAssignment?.attachment_url && !currentAssignment?.attachment_path) {
                      return "No existing attachment.";
                    }
                    if (form.remove_attachment) {
                      return "Existing attachment will be removed.";
                    }
                    return `Current attachment: ${currentAssignment?.attachment_name || "Attached file"}`;
                  })()}
                </span>
              ) : null}
              {form.attachment ? (
                <span style={{ color: "#334155", fontSize: 13 }}>{form.attachment.name}</span>
              ) : null}
              {editingAssignmentId ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    style={{
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      color: "#0f172a",
                      borderRadius: 10,
                      padding: "8px 12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        attachment: null,
                        remove_attachment: true,
                      }))
                    }
                  >
                    Remove Existing Attachment
                  </Button>
                  {form.remove_attachment ? (
                    <Button
                      type="button"
                      style={{
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#0f172a",
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          remove_attachment: false,
                        }))
                      }
                    >
                      Keep Existing Attachment
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
              <Button
                type="button"
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#0f172a",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() => {
                  resetEditor();
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                // style={{
                //   background: "#4f46e5",
                //   color: "#fff",
                //   border: "none",
                //   borderRadius: 12,
                //   padding: "12px 16px",
                //   fontWeight: 700,
                //   cursor: saving ? "not-allowed" : "pointer",
                //   opacity: saving ? 0.7 : 1,
                // }}
                disabled={
                  saving ||
                  !form.title.trim() ||
                  !form.description.trim() ||
                  !form.class_id ||
                  (form.target_type === "student" && !form.student_id)
                }
                onClick={handleSave}
              >
                {saving ? t("common.loading") : editingAssignmentId ? t("assignment.updateAction") : t("assignment.createAction")}
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: 22, marginBottom: 0 }}>
            <h2 style={{ margin: 0 }}>{t("assignment.listTitle")}</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              {canManage ? t("assignment.listSub") : t("assignment.studentListSub")}
            </p>
          </div>

          {loading ? (
            <div style={{ color: "#6b7280" }}>{t("common.loading")}</div>
          ) : assignments.length === 0 ? (
            <div style={{ color: "#6b7280",display:"flex",justifyContent:"center" }}>{t("assignment.noAssignments")}</div>
          ) : (
            <div className="dataTableWrap" style={{ padding: 0, overflowX: "auto" }}>
              <table className="dataTable">
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={tableHeadCellStyle}>Sl No</th>
                    <th style={tableHeadCellStyle}>{t("assignment.titleLabel")}</th>
                    <th style={tableHeadCellStyle}>{t("assignment.targetTypeLabel")}</th>
                    <th style={tableHeadCellStyle}>{t("assignment.dueDateLabel")}</th>
                    <th style={tableHeadCellStyle}>{t("assignment.attachmentLabel")}</th>
                    <th style={tableHeadCellStyle}>Status</th>
                    {canManage ? <th style={tableHeadCellStyle}>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
              {assignments.map((assignment, index) => {
                const attachmentHref = assignment.attachment_url
                  ? (/^https?:\/\//i.test(String(assignment.attachment_url))
                      ? assignment.attachment_url
                      : `${attachmentBaseUrl}${assignment.attachment_url}`)
                  : assignment.attachment_path
                    ? (/^https?:\/\//i.test(String(assignment.attachment_path))
                        ? assignment.attachment_path
                        : `${attachmentBaseUrl}/${String(assignment.attachment_path).replace(/^\/+/, "")}`)
                    : null;
                const targetText =
                  assignment.target_type === "class"
                    ? t("assignment.targetSummaryClass", { value: assignment.class_name || "-" })
                    : t("assignment.targetSummaryStudent", {
                        value: assignment.student_name || assignment.student_roll_number || "-",
                      });

                return (
                  <tr key={assignment.id} className="dataTable__row">
                    <td style={compactCellStyle}>{index + 1}</td>
                    <td style={tableCellStyle}>
                      <div className="dataTable__strong" style={{ minWidth: 180, maxWidth: 240 }}>
                        {assignment.title}
                      </div>
                      <div
                        className="dataTable__subtle"
                        style={{
                          maxWidth: 240,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          wordBreak: "break-word",
                        }}
                      >
                        {assignment.description || "-"}
                      </div>
                      {assignment.created_by_name ? (
                        <div className="dataTable__subtle">{t("assignment.createdBy", { name: assignment.created_by_name })}</div>
                      ) : null}
                    </td>
                    <td style={tableCellStyle}>
                      <div className="dataTable__strong" style={{ textTransform: "capitalize", whiteSpace: "nowrap" }}>
                        {assignment.target_type}
                      </div>
                      <div className="dataTable__subtle" style={{ maxWidth: 180, wordBreak: "break-word" }}>{targetText}</div>
                    </td>
                    <td style={compactCellStyle}>
                      {assignment.due_date
                        ? formatDate(assignment.due_date)
                        : t("assignment.noDueDate")}
                    </td>
                    <td style={compactCellStyle}>
                      {attachmentHref ? (
                        <a
                          href={attachmentHref}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#4f46e5", fontWeight: 600, whiteSpace: "nowrap" }}
                        >
                          {assignment.attachment_name || t("assignment.openAttachment")}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={compactCellStyle}>
                      <span className={`dataTableStatusPill dataTableStatusPill--${assignment.status === "active" ? "active" : "inactive"}`}>
                        {assignment.status}
                      </span>
                    </td>
                    {canManage ? (
                      <td style={{ ...tableCellStyle, position: "relative" }}>
                        <div className="dataTableActionMenu" onClick={(event) => event.stopPropagation()}>
                          <button
                            className="dataTableActionTrigger"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId(openMenuId === assignment.id ? null : assignment.id);
                            }}
                          >
                            <img src={Content} alt="menu" style={{ width: 18, height: 18 }} />
                          </button>
                          {openMenuId === assignment.id ? (
                            <div className="dataTableActionDropdown">
                              <button onClick={() => handleEdit(assignment)}>{t("assignment.editAction")}</button>
                              <button
                                onClick={() => handleDelete(assignment.id)}
                                data-danger="true"
                                disabled={deletingId === assignment.id}
                              >
                                {deletingId === assignment.id ? t("common.loading") : t("notice.delete")}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
