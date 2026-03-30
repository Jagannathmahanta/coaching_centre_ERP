import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../../shared/services/api";

type ParentRecord = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  has_login_account?: boolean;
  login_email?: string | null;
  login_phone?: string | null;
  children: Array<{
    id: number;
    name: string;
    class: string;
    roll_number?: string | null;
  }>;
};

const cardStyle = {
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
};

const buttonStyle = {
  background: "#1d4ed8",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  ...buttonStyle,
  background: "#eff6ff",
  color: "#1d4ed8",
};

export default function ParentsPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [accountDraft, setAccountDraft] = useState({
    open: false,
    parentId: 0,
    parentName: "",
    email: "",
    phone: "",
    password: "",
  });

  const parentsQuery = useQuery({
    queryKey: ["parents"],
    queryFn: async () => {
      const response = await api.get("/parents");
      return (response.data || []) as ParentRecord[];
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async () =>
      api.post("/auth/accounts", {
        role: "parent",
        parent_id: accountDraft.parentId,
        email: accountDraft.email || undefined,
        phone: accountDraft.phone || undefined,
        password: accountDraft.password,
      }),
    onSuccess: async () => {
      setMessage(`Login account created for ${accountDraft.parentName}.`);
      setError("");
      setAccountDraft({ open: false, parentId: 0, parentName: "", email: "", phone: "", password: "" });
      await queryClient.invalidateQueries({ queryKey: ["parents"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to create parent login.");
      setMessage("");
    },
  });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Parents</h1>
        <p style={{ color: "#666", marginTop: 8 }}>View linked children and create parent login access from real parent records.</p>
      </div>

      {message && <div style={{ ...cardStyle, color: "#166534", background: "#f0fdf4" }}>{message}</div>}
      {error && <div style={{ ...cardStyle, color: "#b91c1c", background: "#fef2f2" }}>{error}</div>}

      {accountDraft.open && (
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
          onClick={() => setAccountDraft({ open: false, parentId: 0, parentName: "", email: "", phone: "", password: "" })}
        >
          <div style={{ ...cardStyle, width: "min(560px, 100%)" }} onClick={(event) => event.stopPropagation()}>
            <h2 style={{ margin: 0 }}>Create Parent Login</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>Create a linked login account for {accountDraft.parentName}.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <label style={{ color: "#374151", fontWeight: 700 }}>
                Email
                <input value={accountDraft.email} onChange={(event) => setAccountDraft((current) => ({ ...current, email: event.target.value }))} style={inputStyle} />
              </label>
              <label style={{ color: "#374151", fontWeight: 700 }}>
                Mobile
                <input value={accountDraft.phone} onChange={(event) => setAccountDraft((current) => ({ ...current, phone: event.target.value }))} style={inputStyle} />
              </label>
            </div>
            <label style={{ color: "#374151", fontWeight: 700, display: "block", marginTop: 14 }}>
              Password
              <input type="password" value={accountDraft.password} onChange={(event) => setAccountDraft((current) => ({ ...current, password: event.target.value }))} style={inputStyle} />
            </label>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" style={secondaryButton} onClick={() => setAccountDraft({ open: false, parentId: 0, parentName: "", email: "", phone: "", password: "" })}>
                Cancel
              </button>
              <button type="button" style={buttonStyle} onClick={() => createAccountMutation.mutate()} disabled={createAccountMutation.isPending}>
                {createAccountMutation.isPending ? "Saving..." : "Create Login"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section style={cardStyle}>
        {parentsQuery.isLoading ? (
          <div>Loading parents...</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {(parentsQuery.data || []).map((parent) => (
              <div key={parent.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ color: "#0f172a", fontSize: 18 }}>{parent.name}</strong>
                    <span style={{ color: parent.has_login_account ? "#166534" : "#b45309", fontWeight: 700 }}>
                      {parent.has_login_account ? "Login Ready" : "No Login"}
                    </span>
                  </div>
                  <div style={{ color: "#64748b" }}>{[parent.phone, parent.email].filter(Boolean).join(" | ") || "No contact details"}</div>
                  <div style={{ color: "#334155" }}>
                    <strong>Children:</strong> {parent.children.length ? parent.children.map((child) => `${child.name} (${child.class})`).join(", ") : "No linked students"}
                  </div>
                  {parent.has_login_account && (
                    <div style={{ color: "#64748b" }}>{parent.login_email || parent.login_phone || "-"}</div>
                  )}
                </div>

                <button
                  type="button"
                  style={secondaryButton}
                  onClick={() =>
                    setAccountDraft({
                      open: true,
                      parentId: parent.id,
                      parentName: parent.name,
                      email: parent.login_email || parent.email || "",
                      phone: parent.login_phone || parent.phone || "",
                      password: "",
                    })
                  }
                  disabled={Boolean(parent.has_login_account)}
                >
                  {parent.has_login_account ? "Login Ready" : "Create Login"}
                </button>
              </div>
            ))}

            {(parentsQuery.data || []).length === 0 && <div style={{ color: "#6b7280" }}>No parents found yet.</div>}
          </div>
        )}
      </section>
    </div>
  );
}
