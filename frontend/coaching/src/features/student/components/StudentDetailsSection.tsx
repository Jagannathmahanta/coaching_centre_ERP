import { Field, FormSection, inputStyle } from "./StudentForm";
import type { StudentAdmissionForm } from "../types/students.types";

export function StudentDetailsSection({
  form,
  isEditMode,
  onChange,
}: {
  form: StudentAdmissionForm;
  isEditMode: boolean;
  onChange: (key: keyof StudentAdmissionForm, value: string | boolean | File | null) => void;
}) {
  return (
    <FormSection title="Student Details">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Field label="Student Name">
          <input value={form.name} onChange={(e) => onChange("name", e.target.value)} required style={inputStyle} />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={(e) => onChange("phone", e.target.value)} inputMode="numeric" maxLength={10} placeholder="10 digit mobile" style={inputStyle} />
        </Field>
        <Field label="Email">
          <input value={form.email} onChange={(e) => onChange("email", e.target.value)} type="email" placeholder="name@example.com" style={inputStyle} />
        </Field>
        <Field label="Student Image">
          <div
            style={{
              borderRadius: 8,
              maxWidth: 105,
              textAlign: "center",
            }}
          >
            {/* Hidden Input */}
            <input
              type="file"
              accept="image/*"
              id="studentImageUpload"
              style={{ display: "none" }}
              onChange={(e) => onChange("photo", e.target.files?.[0] || null)}
            />

            {/* Image */}
            {form.photo_url || form.photo ? (
              <img
                src={
                  form.photo
                    ? URL.createObjectURL(form.photo)
                    : form.photo_url
                }
                alt="preview"
                style={{
                  width: "100%",
                  height: 100,
                  objectFit: "cover",
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              />
            ) : (
              <div
                style={{
                  height: 100,
                  borderRadius: 10,
                  background: "#f1f5f9",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                No Image
              </div>
            )}

            {/* Browse Button */}
            <label
              htmlFor="studentImageUpload"
              style={{
                display: "inline-block",
                width: "100%",
                padding: "6px 0",
                background: "#2563eb",
                color: "#fff",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Browse
            </label>
          </div>
        </Field>
        <Field label="Gender">
          <select value={form.gender} onChange={(e) => onChange("gender", e.target.value)} style={inputStyle}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Join Date">
          <input type="date" value={form.join_date} onChange={(e) => onChange("join_date", e.target.value)} style={inputStyle} />
        </Field>
        {isEditMode ? (
          <Field label="Status">
            <select value={form.status} onChange={(e) => onChange("status", e.target.value)} style={inputStyle}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="left">Left</option>
            </select>
          </Field>
        ) : null}
      </div>
      {/* 
      {form.photo_url ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#374151", fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Current Photo</div>
          <img
            src={form.photo_url}
            alt="Student profile"
            style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 14, border: "1px solid #d1d5db" }}
          />
        </div>
      ) : null}

      {form.photo ? (
        <div style={{ marginTop: 10, color: "#334155", fontSize: 13 }}>
          Selected image: {form.photo.name}
        </div>
      ) : null} */}

      {isEditMode && form.status !== "active" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          <Field label="Inactive / Left Date">
            <input type="date" value={form.left_date} onChange={(e) => onChange("left_date", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Reason">
            <input value={form.left_reason} onChange={(e) => onChange("left_reason", e.target.value)} style={inputStyle} />
          </Field>
        </div>
      ) : null}

      <div style={{ marginTop: 18, background: "#f8fafc", borderRadius: 12, padding: 16, color: "#334155", border: "1px solid #e2e8f0" }}>
        {isEditMode ? "Admission number remains unchanged during edit." : "Admission number is generated automatically as `YYYYMM###`."}
      </div>
    </FormSection>
  );
}
