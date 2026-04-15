import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  ExternalLink,
  LogIn,
  Plus,
  RefreshCcw,
  School2,
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/hooks/AuthContext";
import {
  backupPlatformAuth,
  hasPlatformAuthBackup,
  restorePlatformAuth,
  saveAuth,
} from "../../../shared/services/auth";
import { usePlatformCentersQuery } from "../hooks/usePlatformCentersQuery";
import {
  createPlatformCenter,
  impersonateCenter,
  updatePlatformCenter,
  updatePlatformCenterStatus,
} from "../services/dashboard.service";

/* ─────────────────────────── helpers ─────────────────────────── */

function slugifyCenterName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildInstituteLoginUrl(slug: string) {
  if (typeof window === "undefined")
    return `/login?center=${encodeURIComponent(slug)}`;

  const { protocol, hostname } = window.location;

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  ) {
    return `${protocol}//${hostname}/login?center=${encodeURIComponent(slug)}`;
  }

  // Always extract the base domain (last 3 parts for co.in, or last 2 for .com)
  const parts = hostname.split(".");
    console.log("[buildInstituteLoginUrl]", {
    slug,
    hostname,
    parts,
    partsLength: parts.length,
    sliceMinus3: parts.slice(-3).join("."),
    sliceMinus2: parts.slice(-2).join("."),
  });
  
  // Handle country-code TLDs like co.in, co.uk, com.au (take last 3 parts)
  // vs simple TLDs like .com, .net (take last 2 parts)
  const secondLevelShort = ["co", "com", "net", "org", "gov", "edu"];
  const baseDomain =
    parts.length >= 4 && secondLevelShort.includes(parts[parts.length - 2])
      ? parts.slice(-3).join(".")   // e.g. tutorialhub.co.in
      : parts.slice(-2).join(".");  // e.g. tutorialhub.com

  return `${protocol}//${slug}.${baseDomain}/login`;
}

const initialForm = {
  name: "",
  slug: "",
  city: "",
  plan: "basic",
  admin_name: "",
  admin_email: "",
  admin_phone: "",
  admin_password: "",
};

type View = "list" | "create" | "edit";

/* ─────────────────────────── component ─────────────────────────── */

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { profile, setProfile } = useAuth();
  const { data, isLoading, refetch, isRefetching } = usePlatformCentersQuery();

  const [view, setView] = useState<View>("list");
  const [editingCenterId, setEditingCenterId] = useState<number | null>(null);
  const [formTouchedSlug, setFormTouchedSlug] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [switchingCenterId, setSwitchingCenterId] = useState<number | null>(null);
  const [statusCenterId, setStatusCenterId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [planOpen, setPlanOpen] = useState(false);
  const canRestorePlatform = useMemo(() => hasPlatformAuthBackup(), []);

  useEffect(() => {
    if (formTouchedSlug) return;
    setForm((c) => ({ ...c, slug: slugifyCenterName(c.name) }));
  }, [formTouchedSlug, form.name]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingCenterId(null);
    setFormTouchedSlug(false);
    setFormError("");
    setFormSuccess("");
  };

  const openCreate = () => {
    resetForm();
    setView("create");
  };

  const openEdit = (center: {
    id: number;
    name: string;
    slug: string;
    city?: string | null;
    plan?: string | null;
  }) => {
    setEditingCenterId(center.id);
    setFormTouchedSlug(true);
    setForm({
      name: center.name,
      slug: center.slug,
      city: center.city || "",
      plan: center.plan || "basic",
      admin_name: "",
      admin_email: "",
      admin_phone: "",
      admin_password: "",
    });
    setFormError("");
    setFormSuccess("");
    setView("edit");
  };

  const handleImpersonate = async (centerId: number) => {
    setActionError("");
    setSwitchingCenterId(centerId);
    try {
      backupPlatformAuth();
      const payload = await impersonateCenter(centerId);
      saveAuth(payload);
      setProfile(payload.user);
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setActionError(e?.response?.data?.error || e?.message || "Failed.");
    } finally {
      setSwitchingCenterId(null);
    }
  };

  const handleRestore = () => {
    const restored = restorePlatformAuth();
    if (restored?.user) {
      setProfile(restored.user);
      navigate("/dashboard", { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormSubmitting(true);
    try {
      if (editingCenterId) {
        await updatePlatformCenter(editingCenterId, {
          name: form.name,
          slug: form.slug,
          city: form.city,
          plan: form.plan,
        });
        setFormSuccess("Institute updated successfully.");
      } else {
        await createPlatformCenter({
          name: form.name,
          slug: form.slug,
          city: form.city,
          plan: form.plan,
          admin_name: form.admin_name,
          admin_email: form.admin_email,
          admin_phone: form.admin_phone || undefined,
          admin_password: form.admin_password,
        });
        setFormSuccess("Institute created successfully.");
      }
      await refetch();
      resetForm();
      setView("list");
    } catch (e: any) {
      setFormError(e?.response?.data?.error || e?.message || "Unable to save.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (
    centerId: number,
    status: "active" | "inactive"
  ) => {
    setActionError("");
    setStatusCenterId(centerId);
    try {
      await updatePlatformCenterStatus(centerId, status);
      await refetch();
    } catch (e: any) {
      setActionError(e?.response?.data?.error || e?.message || "Failed.");
    } finally {
      setStatusCenterId(null);
    }
  };

  const totalCenters = data?.centers?.length || 0;
  const activeCenters =
    data?.centers?.filter((c) => c.status === "active").length || 0;

  /* ── FORM VIEW ── */
  if (view === "create" || view === "edit") {
    return (
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <button style={styles.backBtn} onClick={() => { resetForm(); setView("list"); }}>
            <ArrowLeft size={16} />
            Back to institutes
          </button>
          <h1 style={styles.pageTitle}>
            {view === "edit" ? "Edit Institute" : "Create Institute"}
          </h1>
          <p style={styles.pageSubtitle}>
            {view === "edit"
              ? "Update the institute identity and plan."
              : "Add a new tenant with its first administrator account."}
          </p>
        </div>

        {/* Form card */}
        <div style={styles.formCard}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formSection}>
              <div style={styles.formSectionTitle}>Institute Details</div>
              <div style={styles.formGrid}>
                <label style={styles.label}>
                  <span style={styles.labelText}>Institute name <span style={styles.required}>*</span></span>
                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, name: e.target.value }))
                    }
                    placeholder="e.g. Bright Academy"
                    required
                  />
                </label>

                <label style={styles.label}>
                  <span style={styles.labelText}>Slug <span style={styles.required}>*</span></span>
                  <input
                    style={styles.input}
                    value={form.slug}
                    onChange={(e) => {
                      setFormTouchedSlug(true);
                      setForm((c) => ({
                        ...c,
                        slug: slugifyCenterName(e.target.value),
                      }));
                    }}
                    placeholder="bright-academy"
                    required
                  />
                  <span style={styles.hint}>
                    Used in the login URL · auto-generated from name
                  </span>
                </label>

                <label style={styles.label}>
                  <span style={styles.labelText}>City</span>
                  <input
                    style={styles.input}
                    value={form.city}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, city: e.target.value }))
                    }
                    placeholder="e.g. Bhubaneswar"
                  />
                </label>

                <div style={styles.label}>
                  <span style={styles.labelText}>Plan</span>
                  <div style={{ position: "relative" as const }}>
                    <button
                      type="button"
                      style={styles.selectInput}
                      onClick={() => setPlanOpen((o) => !o)}
                    >
                      <span>{form.plan.charAt(0).toUpperCase() + form.plan.slice(1)}</span>
                      <span style={styles.selectArrow}>▾</span>
                    </button>
                    {planOpen && (
                      <div style={styles.dropdownMenu}>
                        {["basic", "standard", "premium"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            style={{
                              ...styles.dropdownItem,
                              ...(form.plan === p ? styles.dropdownItemActive : {}),
                            }}
                            onClick={() => {
                              setForm((c) => ({ ...c, plan: p }));
                              setPlanOpen(false);
                            }}
                          >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {view === "create" && (
              <div style={styles.formSection}>
                <div style={styles.formSectionTitle}>Administrator Account</div>
                <div style={styles.formGrid}>
                  <label style={styles.label}>
                    <span style={styles.labelText}>Admin name <span style={styles.required}>*</span></span>
                    <input
                      style={styles.input}
                      value={form.admin_name}
                      onChange={(e) =>
                        setForm((c) => ({ ...c, admin_name: e.target.value }))
                      }
                      required
                    />
                  </label>

                  <label style={styles.label}>
                    <span style={styles.labelText}>Admin email <span style={styles.required}>*</span></span>
                    <input
                      style={styles.input}
                      type="email"
                      value={form.admin_email}
                      onChange={(e) =>
                        setForm((c) => ({ ...c, admin_email: e.target.value }))
                      }
                      required
                    />
                  </label>

                  <label style={styles.label}>
                    <span style={styles.labelText}>Admin phone</span>
                    <input
                      style={styles.input}
                      value={form.admin_phone}
                      onChange={(e) =>
                        setForm((c) => ({ ...c, admin_phone: e.target.value }))
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    <span style={styles.labelText}>Admin password <span style={styles.required}>*</span></span>
                    <input
                      style={styles.input}
                      type="password"
                      value={form.admin_password}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          admin_password: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                </div>
              </div>
            )}

            {formError && (
              <div style={styles.alertError}>
                <XCircle size={16} />
                {formError}
              </div>
            )}

            <div style={styles.formFooter}>
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={() => { resetForm(); setView("list"); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.btnPrimary}
                disabled={formSubmitting}
              >
                {formSubmitting
                  ? "Saving…"
                  : view === "edit"
                  ? "Save changes"
                  : "Create institute"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ── LIST VIEW ── */
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.pageTitle}>Platform Console</h1>
          <p style={styles.pageSubtitle}>
            Cross-institute access and tenant overview · logged in as{" "}
            <strong>{profile?.name || "Super Admin"}</strong>
          </p>
        </div>
        <div style={styles.topBarActions}>
          {canRestorePlatform ? (
            <button style={styles.btnSecondary} onClick={handleRestore}>
              <Shield size={15} />
              Return to platform
            </button>
          ) : (
            <button
              style={styles.btnSecondary}
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCcw size={15} />
              {isRefetching ? "Refreshing…" : "Refresh"}
            </button>
          )}
          <button style={styles.btnPrimary} onClick={openCreate}>
            <Plus size={15} />
            Create institute
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#eff6ff" }}>
            <School2 size={20} color="#2563eb" />
          </div>
          <div>
            <div style={styles.statValue}>{totalCenters}</div>
            <div style={styles.statLabel}>Total Institutes</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#f0fdf4" }}>
            <CheckCircle2 size={20} color="#16a34a" />
          </div>
          <div>
            <div style={styles.statValue}>{activeCenters}</div>
            <div style={styles.statLabel}>Active Centers</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#fef3c7" }}>
            <XCircle size={20} color="#d97706" />
          </div>
          <div>
            <div style={styles.statValue}>{totalCenters - activeCenters}</div>
            <div style={styles.statLabel}>Inactive Centers</div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {actionError && (
        <div style={styles.alertError}>
          <XCircle size={16} /> {actionError}
        </div>
      )}
      {formSuccess && (
        <div style={styles.alertSuccess}>
          <CheckCircle2 size={16} /> {formSuccess}
        </div>
      )}

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <span style={styles.tableTitle}>Institutes</span>
          <span style={styles.tableCount}>{totalCenters} total</span>
        </div>

        {isLoading ? (
          <div style={styles.emptyState}>Loading institutes…</div>
        ) : !data?.centers?.length ? (
          <div style={styles.emptyState}>
            No institutes yet.{" "}
            <button style={styles.inlineLink} onClick={openCreate}>
              Create one
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    "Institute",
                    "Slug",
                    "City",
                    "Plan",
                    "Students",
                    "Teachers",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} style={styles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.centers.map((center, idx) => {
                  const loginUrl = buildInstituteLoginUrl(center.slug);
                  console.log("Institute login URL:", loginUrl);
                  const isActive = center.status === "active";
                  return (
                    <tr
                      key={center.id}
                      style={{
                        ...styles.tr,
                        background: idx % 2 === 0 ? "#fff" : "#f9fafb",
                      }}
                    >
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        {center.name}
                        <div style={styles.loginLink}>
                          <a
                            href={loginUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.linkSmall}
                          >
                            <ExternalLink size={11} />
                            Public login
                          </a>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <code style={styles.code}>{center.slug}</code>
                      </td>
                      <td style={styles.td}>{center.city || "—"}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.planBadge,
                            ...(center.plan === "premium"
                              ? styles.planPremium
                              : center.plan === "standard"
                              ? styles.planStandard
                              : styles.planBasic),
                          }}
                        >
                          {center.plan || "basic"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {center.student_count}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {center.active_teacher_count}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            isActive ? styles.badgeActive : styles.badgeInactive
                          }
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          {/* Edit */}
                          <button
                            style={styles.actionBtn}
                            onClick={() => openEdit(center)}
                            title="Edit"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          {/* Open institute */}
                          <button
                            style={styles.actionBtnPrimary}
                            disabled={switchingCenterId === center.id}
                            onClick={() => handleImpersonate(center.id)}
                            title="Open institute"
                          >
                            <LogIn size={14} />
                            {switchingCenterId === center.id
                              ? "Opening…"
                              : "Open"}
                          </button>

                          {/* Suspend / Reactivate */}
                          <button
                            style={
                              isActive
                                ? styles.actionBtnDanger
                                : styles.actionBtnSuccess
                            }
                            disabled={statusCenterId === center.id}
                            onClick={() =>
                              handleStatusChange(
                                center.id,
                                isActive ? "inactive" : "active"
                              )
                            }
                          >
                            {statusCenterId === center.id
                              ? "…"
                              : isActive
                              ? "Suspend"
                              : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── styles ─────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "10px 2px",
    minHeight: "100vh",
    background: "#f4f6f9",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    boxSizing: "border-box",

  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    flexWrap: "wrap",
    gap: 16,
  },
  pageHeader: {
    marginBottom: 28,
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    padding: "0 0 12px",
    marginBottom: 4,
  },
  pageTitle: {
    margin: "0 0 4px",
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "-0.3px",
  },
  pageSubtitle: {
    margin: 0,
    fontSize: 14,
    color: "#6b7280",
  },
  topBarActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 16px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#fff",
    color: "#374151",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    padding: "9px 16px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  statsRow: {
    display: "flex",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  statCard: {
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    minWidth: 180,
    flex: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 3,
  },
  alertError: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    marginBottom: 16,
  },
  alertSuccess: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    marginBottom: 16,
  },
  tableCard: {
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1.5px solid #f3f4f6",
  },
  tableTitle: {
    fontWeight: 600,
    fontSize: 16,
    color: "#111827",
  },
  tableCount: {
    fontSize: 13,
    color: "#9ca3af",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    padding: "11px 16px",
    textAlign: "left" as const,
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1.5px solid #f3f4f6",
    background: "#f9fafb",
    whiteSpace: "nowrap" as const,
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.15s",
  },
  td: {
    padding: "13px 16px",
    color: "#374151",
    verticalAlign: "middle" as const,
  },
  code: {
    background: "#f3f4f6",
    borderRadius: 5,
    padding: "2px 7px",
    fontSize: 12,
    fontFamily: "monospace",
    color: "#374151",
  },
  loginLink: {
    marginTop: 4,
  },
  linkSmall: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "#6b7280",
    textDecoration: "none",
  },
  planBadge: {
    display: "inline-block",
    padding: "2px 9px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    textTransform: "capitalize" as const,
  },
  planBasic: { background: "#f3f4f6", color: "#374151" },
  planStandard: { background: "#eff6ff", color: "#1d4ed8" },
  planPremium: { background: "#faf5ff", color: "#7c3aed" },
  badgeActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 9px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    background: "#dcfce7",
    color: "#15803d",
  },
  badgeInactive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 9px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    background: "#f3f4f6",
    color: "#6b7280",
  },
  actionGroup: {
    display: "flex",
    gap: 6,
    flexWrap: "nowrap" as const,
    alignItems: "center",
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 10px",
    borderRadius: 6,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  actionBtnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 10px",
    borderRadius: 6,
    border: "none",
    background: "#111827",
    color: "#fff",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  actionBtnDanger: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 10px",
    borderRadius: 6,
    border: "1.5px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  actionBtnSuccess: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 10px",
    borderRadius: 6,
    border: "1.5px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  emptyState: {
    padding: "48px 24px",
    textAlign: "center" as const,
    color: "#9ca3af",
    fontSize: 15,
  },
  inlineLink: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: 15,
    textDecoration: "underline",
  },
  /* form */
  formCard: {
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 14,
    padding: "28px 32px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 28,
  },
  formSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    paddingBottom: 8,
    borderBottom: "1.5px solid #f3f4f6",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px 24px",
  },
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
  },
  labelText: {
    display: "block",
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
  },
  required: {
    color: "#ef4444",
    marginLeft: 2,
  },
  input: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    color: "#111827",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  select: {
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    MozAppearance: "none" as const,
  },
  selectInput: {
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: "9px 12px",
    borderRadius: 8,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    color: "#111827",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    cursor: "pointer",
    outline: "none",
    textAlign: "left" as const,
  },
  selectArrow: {
    color: "#6b7280",
    fontSize: 14,
    marginLeft: 8,
  },
  dropdownMenu: {
    position: "absolute" as const,
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    zIndex: 50,
    boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
    overflow: "hidden",
  },
  dropdownItem: {
    display: "block" as const,
    width: "100%",
    padding: "10px 14px",
    border: "none",
    background: "none",
    fontSize: 14,
    color: "#374151",
    cursor: "pointer",
    textAlign: "left" as const,
    fontFamily: "inherit",
  },
  dropdownItemActive: {
    background: "#eff6ff",
    color: "#2563eb",
    fontWeight: 600,
  },
  hint: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: -2,
  },
  formFooter: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    paddingTop: 4,
  },
};
