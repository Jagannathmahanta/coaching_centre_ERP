import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

type FeeDefinition = {
  id: number;
  name: string;
  program_type: "academic" | "course";
  board?: string | null;
  class_name?: string | null;
  course_name?: string | null;
  academic_year?: string | null;
  duration_months: number;
  session_start_month?: number | null;
  session_end_month?: number | null;
  tuition_total: string | number;
  hostel_total: string | number;
  transport_total: string | number;
};

type StudentDetail = {
  id: number;
  name: string;
  phone?: string | null;
  gender?: string | null;
  join_date?: string | null;
  class: string;
  roll_number?: string | null;
  fee_structure_id?: number | null;
  billing_cycle?: string | null;
  academic_year?: string | null;
  due_day?: number | null;
  include_hostel?: boolean;
  include_transport?: boolean;
  hostel_id?: number | null;
  room_id?: number | null;
  hostel_name?: string | null;
  room_number?: string | null;
  notes?: string | null;
};

type Hostel = {
  id: number;
  hostel_name: string;
  gender_type: "boys" | "girls";
  status: string;
  vacant_beds?: string | number;
};

type HostelRoom = {
  id: number;
  hostel_id: number;
  room_number: string;
  capacity: number;
  occupied: number;
  vacant_seats?: string | number;
  status: string;
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
  marginTop: 6,
};

const sectionStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

const initialForm = {
  name: "",
  phone: "",
  gender: "male",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  create_parent_login: false,
  parent_login_password: "",
  create_student_login: false,
  student_login_email: "",
  student_login_phone: "",
  student_login_password: "",
  join_date: new Date().toISOString().slice(0, 10),
  fee_structure_id: "",
  class: "",
  billing_cycle: "monthly",
  academic_year: "2026-2027",
  due_day: "5",
  include_hostel: false,
  hostel_id: "",
  room_id: "",
  include_transport: false,
  notes: "",
};

const cycleLabels: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half Yearly",
  yearly: "Yearly",
  full_package: "Full Package",
};

const currency = (value: number) => `₹${value.toFixed(2)}`;

function monthDiffInclusive(start: Date, end: Date) {
  return ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth()) + 1;
}

function startOfMonth(dateString: string) {
  const date = new Date(dateString);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export default function NewStudentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [definitions, setDefinitions] = useState<FeeDefinition[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [initialStudent, setInitialStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [definitionsRes, hostelsRes, studentRes] = await Promise.all([
          api.get("/fees/structures"),
          api.get("/hostel"),
          isEditMode ? api.get(`/students/${id}`) : Promise.resolve({ data: null }),
        ]);

        setDefinitions(definitionsRes.data || []);
        setHostels(hostelsRes.data || []);

        const student = studentRes.data as StudentDetail | null;
        if (student) {
          setInitialStudent(student);
          setForm({
            name: student.name || "",
            phone: student.phone || "",
            gender: student.gender || "male",
            parent_name: "",
            parent_phone: "",
            parent_email: "",
            create_parent_login: false,
            parent_login_password: "",
            create_student_login: false,
            student_login_email: "",
            student_login_phone: "",
            student_login_password: "",
            join_date: student.join_date ? String(student.join_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            fee_structure_id: student.fee_structure_id ? String(student.fee_structure_id) : "",
            class: student.class || "",
            billing_cycle: student.billing_cycle || "monthly",
            academic_year: student.academic_year || "2026-2027",
            due_day: String(student.due_day || 5),
            include_hostel: Boolean(student.include_hostel),
            hostel_id: student.hostel_id ? String(student.hostel_id) : "",
            room_id: student.room_id ? String(student.room_id) : "",
            include_transport: Boolean(student.include_transport),
            notes: student.notes || "",
          });
        }
      } catch (loadError) {
        console.error("Failed to load admission data:", loadError);
        setError("Failed to load admission form data.");
      } finally {
        setBootLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode]);

  useEffect(() => {
    const loadRooms = async () => {
      if (!form.include_hostel || !form.hostel_id) {
        setRooms([]);
        return;
      }

      try {
        const response = await api.get("/hostel/rooms/list", {
          params: { hostel_id: form.hostel_id },
        });
        setRooms(response.data || []);
      } catch (loadError) {
        console.error("Failed to load hostel rooms:", loadError);
        setRooms([]);
      }
    };

    loadRooms();
  }, [form.include_hostel, form.hostel_id]);

  const selectedDefinition = useMemo(
    () => definitions.find((item) => String(item.id) === form.fee_structure_id),
    [definitions, form.fee_structure_id]
  );

  const filteredHostels = useMemo(() => {
    const targetGender = form.gender === "female" ? "girls" : "boys";
    return hostels.filter((hostel) => hostel.status === "active" && hostel.gender_type === targetGender);
  }, [form.gender, hostels]);

  const availableRooms = useMemo(
    () => rooms.filter((room) => room.status === "active" && (Number(room.vacant_seats || 0) > 0 || String(room.id) === form.room_id)),
    [rooms, form.room_id]
  );

  const feePreview = useMemo(() => {
    if (!selectedDefinition || !form.join_date) return null;

    const joinMonth = startOfMonth(form.join_date);
    let applicableMonths = selectedDefinition.duration_months;

    if (selectedDefinition.program_type === "academic" && selectedDefinition.academic_year) {
      const [startYear, endYear] = selectedDefinition.academic_year.split("-").map(Number);
      const sessionStart = new Date(startYear, Number(selectedDefinition.session_start_month || 3) - 1, 1);
      const sessionEnd = endOfMonth(new Date(endYear, Number(selectedDefinition.session_end_month || 2) - 1, 1));
      const effectiveStart = joinMonth > sessionStart ? joinMonth : sessionStart;
      applicableMonths = effectiveStart > sessionEnd ? 0 : monthDiffInclusive(effectiveStart, sessionEnd);
    }

    if (applicableMonths <= 0) return null;

    const tuitionMonthly = Number(selectedDefinition.tuition_total) / Number(selectedDefinition.duration_months);
    const hostelMonthly = form.include_hostel ? Number(selectedDefinition.hostel_total) / Number(selectedDefinition.duration_months) : 0;
    const transportMonthly = form.include_transport ? Number(selectedDefinition.transport_total) / Number(selectedDefinition.duration_months) : 0;

    const cycleSize = form.billing_cycle === "full_package"
      ? applicableMonths
      : { monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12 }[form.billing_cycle] || 1;

    const firstInstallmentMonths = Math.min(cycleSize, applicableMonths);
    const installmentCount = Math.ceil(applicableMonths / cycleSize);
    const tuitionTotal = tuitionMonthly * applicableMonths;
    const hostelTotal = hostelMonthly * applicableMonths;
    const transportTotal = transportMonthly * applicableMonths;

    return {
      applicableMonths,
      installmentCount,
      firstInstallmentMonths,
      tuitionTotal,
      hostelTotal,
      transportTotal,
      grandTotal: tuitionTotal + hostelTotal + transportTotal,
      firstInstallmentTotal: (tuitionMonthly + hostelMonthly + transportMonthly) * firstInstallmentMonths,
    };
  }, [selectedDefinition, form.join_date, form.include_hostel, form.include_transport, form.billing_cycle]);

  const handleChange = (key: string, value: string | boolean) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "fee_structure_id") {
        const definition = definitions.find((item) => String(item.id) === String(value));
        if (definition) {
          next.class = definition.class_name || definition.course_name || definition.name;
          next.academic_year = definition.academic_year || current.academic_year;
          next.billing_cycle = definition.program_type === "course" ? "full_package" : current.billing_cycle;
        }
      }
      if (key === "include_hostel" && !value) {
        next.hostel_id = "";
        next.room_id = "";
      }
      if (key === "gender") {
        next.hostel_id = "";
        next.room_id = "";
      }
      if (key === "hostel_id") {
        next.room_id = "";
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name,
        class: form.class,
        phone: form.phone || undefined,
        gender: form.gender,
        parent_name: form.parent_name || undefined,
        parent_phone: form.parent_phone || undefined,
        parent_email: form.parent_email || undefined,
        create_parent_login: form.create_parent_login,
        parent_login_password: form.parent_login_password || undefined,
        create_student_login: form.create_student_login,
        student_login_email: form.student_login_email || undefined,
        student_login_phone: form.student_login_phone || undefined,
        student_login_password: form.student_login_password || undefined,
        join_date: form.join_date,
        fee_structure_id: form.fee_structure_id ? Number(form.fee_structure_id) : undefined,
        billing_cycle: form.billing_cycle,
        academic_year: form.academic_year,
        due_day: Number(form.due_day),
        include_hostel: form.include_hostel,
        hostel_id: form.hostel_id ? Number(form.hostel_id) : undefined,
        room_id: form.room_id ? Number(form.room_id) : undefined,
        include_transport: form.include_transport,
        notes: form.notes || undefined,
      };

      if (isEditMode) {
        await api.patch(`/students/${id}`, {
          name: payload.name,
          class: payload.class,
          phone: payload.phone,
          gender: payload.gender,
          join_date: payload.join_date,
          include_hostel: payload.include_hostel,
          hostel_id: payload.hostel_id,
          room_id: payload.room_id,
        });

        const feePlanChanged = Boolean(
          payload.fee_structure_id &&
          initialStudent &&
          (
            Number(payload.fee_structure_id) !== Number(initialStudent.fee_structure_id || 0) ||
            payload.billing_cycle !== (initialStudent.billing_cycle || "monthly") ||
            payload.academic_year !== (initialStudent.academic_year || "2026-2027") ||
            Number(payload.due_day) !== Number(initialStudent.due_day || 5) ||
            payload.include_transport !== Boolean(initialStudent.include_transport) ||
            (payload.notes || "") !== (initialStudent.notes || "")
          )
        );

        if (feePlanChanged) {
          await api.patch(`/fees/student/${id}/plan`, {
            fee_structure_id: payload.fee_structure_id,
            billing_cycle: payload.billing_cycle,
            academic_year: payload.academic_year,
            due_day: payload.due_day,
            include_transport: payload.include_transport,
            notes: payload.notes,
          });
        }

        setSuccess(feePlanChanged ? "Admission and fee plan updated successfully." : "Admission updated successfully.");
        setTimeout(() => navigate("/students"), 1200);
      } else {
        const response = await api.post("/students", payload);
        const createdStudentId = response.data?.student?.id;
        const admissionNumber = response.data?.student?.roll_number;

        setSuccess(`Admission completed. Student ID ${createdStudentId} created with admission no ${admissionNumber}.`);
        setForm(initialForm);
        setTimeout(() => navigate("/fees"), 1200);
      }
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || `Failed to ${isEditMode ? "update" : "create"} admission.`);
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) {
    return <div style={sectionStyle}>Loading admission form...</div>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>{isEditMode ? "Edit Admission" : "New Admission"}</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          {isEditMode
            ? "Update admission details here. Fee-plan updates are allowed only when no payment history exists for that plan."
            : "Choose the fee definition first. The backend will auto-generate the admission number and bill only the applicable remaining months."}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Student Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <Field label="Student Name">
              <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required style={inputStyle} />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(e) => handleChange("gender", e.target.value)} style={inputStyle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Join Date">
              <input type="date" value={form.join_date} onChange={(e) => handleChange("join_date", e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={{ marginTop: 18, background: "#f8fafc", borderRadius: 12, padding: 16, color: "#334155", border: "1px solid #e2e8f0" }}>
            {isEditMode ? "Admission number remains unchanged during edit." : "Admission number is generated automatically as `YYYYMM###`."}
          </div>
        </div>

        {!isEditMode && (
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Guardian Details</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <Field label="Father / Guardian Name">
                <input value={form.parent_name} onChange={(e) => handleChange("parent_name", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Guardian Mobile">
                <input value={form.parent_phone} onChange={(e) => handleChange("parent_phone", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Guardian Email">
                <input value={form.parent_email} onChange={(e) => handleChange("parent_email", e.target.value)} style={inputStyle} />
              </Field>
            </div>

            <div style={{ marginTop: 18 }}>
              <CheckboxCard
                label="Create Parent Login Now"
                checked={form.create_parent_login}
                onChange={(checked) => handleChange("create_parent_login", checked)}
                helper="Guardian can log in with email or mobile and see student-related modules."
              />
            </div>

            {form.create_parent_login && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
                <Field label="Parent Login Password">
                  <input type="password" value={form.parent_login_password} onChange={(e) => handleChange("parent_login_password", e.target.value)} style={inputStyle} />
                </Field>
              </div>
            )}
          </div>
        )}

        {!isEditMode && (
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Student Login</h2>
            <CheckboxCard
              label="Create Student Login Now"
              checked={form.create_student_login}
              onChange={(checked) => handleChange("create_student_login", checked)}
              helper="Student can use the portal for leave, attendance, and result access."
            />

            {form.create_student_login && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
                <Field label="Student Login Email">
                  <input value={form.student_login_email} onChange={(e) => handleChange("student_login_email", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Student Login Mobile">
                  <input value={form.student_login_phone} onChange={(e) => handleChange("student_login_phone", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Student Login Password">
                  <input type="password" value={form.student_login_password} onChange={(e) => handleChange("student_login_password", e.target.value)} style={inputStyle} />
                </Field>
              </div>
            )}
          </div>
        )}

        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Fee Definition</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <Field label="Program">
              <select value={form.fee_structure_id} onChange={(e) => handleChange("fee_structure_id", e.target.value)} required style={inputStyle}>
                <option value="">Select fee definition</option>
                {definitions.map((definition) => (
                  <option key={definition.id} value={definition.id}>
                    {definition.name} {definition.board ? `• ${definition.board}` : ""} {definition.academic_year ? `• ${definition.academic_year}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Billing Cycle">
              <select
                value={form.billing_cycle}
                onChange={(e) => handleChange("billing_cycle", e.target.value)}
                style={inputStyle}
                disabled={selectedDefinition?.program_type === "course"}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
                <option value="full_package">Full Package</option>
              </select>
            </Field>
            <Field label="Due Day">
              <input type="number" min="1" max="28" value={form.due_day} onChange={(e) => handleChange("due_day", e.target.value)} style={inputStyle} />
            </Field>
          </div>

          {selectedDefinition && (
            <div style={{ marginTop: 18, background: "#eff6ff", borderRadius: 12, padding: 16, color: "#1e3a8a" }}>
              <strong>{selectedDefinition.name}</strong>
              <div style={{ marginTop: 6 }}>
                Type: {selectedDefinition.program_type} • Duration: {selectedDefinition.duration_months} months
                {selectedDefinition.board ? ` • Board: ${selectedDefinition.board}` : ""}
              </div>
            </div>
          )}
        </div>

        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Hostel And Transport</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Use the checkboxes below if the student is taking hostel or transport.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <CheckboxCard
              label="Hostel Required"
              checked={form.include_hostel}
              onChange={(checked) => handleChange("include_hostel", checked)}
              helper={selectedDefinition ? `Hostel total ${currency(Number(selectedDefinition.hostel_total))}` : "Choose fee definition first"}
            />
            <CheckboxCard
              label="Transport Required"
              checked={form.include_transport}
              onChange={(checked) => handleChange("include_transport", checked)}
              helper={selectedDefinition ? `Transport total ${currency(Number(selectedDefinition.transport_total))}` : "Choose fee definition first"}
            />
          </div>

          {form.include_hostel && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
              <Field label={form.gender === "female" ? "Girls Hostel" : "Boys Hostel"}>
                <select value={form.hostel_id} onChange={(e) => handleChange("hostel_id", e.target.value)} style={inputStyle}>
                  <option value="">Select hostel</option>
                  {filteredHostels.map((hostel) => (
                    <option key={hostel.id} value={hostel.id}>
                      {hostel.hostel_name} • Vacant beds {hostel.vacant_beds || 0}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Room">
                <select value={form.room_id} onChange={(e) => handleChange("room_id", e.target.value)} style={inputStyle}>
                  <option value="">Select room</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_number} • Vacant {room.vacant_seats || 0}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>

        {feePreview && selectedDefinition && (
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0 }}>Live Fee Preview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <Metric label="Applicable Months" value={String(feePreview.applicableMonths)} />
              <Metric label="Tuition Total" value={currency(feePreview.tuitionTotal)} />
              <Metric label="Hostel Total" value={currency(feePreview.hostelTotal)} />
              <Metric label="Transport Total" value={currency(feePreview.transportTotal)} />
              <Metric label="Grand Total" value={currency(feePreview.grandTotal)} />
              <Metric label={`${cycleLabels[form.billing_cycle]} Installments`} value={String(feePreview.installmentCount)} />
              <Metric label="First Installment" value={currency(feePreview.firstInstallmentTotal)} />
            </div>
          </div>
        )}

        <div style={sectionStyle}>
          <Field label="Admission Notes">
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            />
          </Field>

          {error && <div style={{ marginTop: 16, color: "#b91c1c", background: "#fef2f2", padding: 12, borderRadius: 10 }}>{error}</div>}
          {success && <div style={{ marginTop: 16, color: "#166534", background: "#f0fdf4", padding: 12, borderRadius: 10 }}>{success}</div>}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              type="submit"
              disabled={loading || !selectedDefinition}
              style={{
                background: loading || !selectedDefinition ? "#93c5fd" : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 18px",
                fontWeight: 700,
                cursor: loading || !selectedDefinition ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (isEditMode ? "Updating admission..." : "Creating admission...") : (isEditMode ? "Update Admission" : "Create Admission And Fee Plan")}
            </button>

            <button
              type="button"
              onClick={() => navigate("/students")}
              style={{
                background: "#f3f4f6",
                color: "#111827",
                border: "none",
                borderRadius: 10,
                padding: "12px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 4, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function CheckboxCard({
  label,
  checked,
  onChange,
  helper,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helper: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: 18,
        borderRadius: 14,
        border: checked ? "1px solid #2563eb" : "1px solid #d1d5db",
        background: checked ? "#eff6ff" : "#fff",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ width: 18, height: 18, marginTop: 2, accentColor: "#2563eb" }}
      />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <strong>{label}</strong>
          <span style={{ color: checked ? "#2563eb" : "#94a3b8", fontWeight: 700 }}>
            {checked ? "Selected" : "Not selected"}
          </span>
        </div>
        <div style={{ color: "#64748b", marginTop: 10, fontSize: 14 }}>{helper}</div>
      </div>
    </label>
  );
}
