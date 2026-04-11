import { useEffect, useState } from "react";
import type { Teacher } from "../types/teacher.types";
import Content from "../../../assets/Content.png";
import "../../../shared/styles/dataTable.css";

const cardStyle = {
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const tableCellStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left" as const,
  verticalAlign: "top" as const,
};

const roleBadgeStyle = (isStaff?: boolean) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
  border: "1px solid",
  background: isStaff ? "#fff7ed" : "#eff6ff",
  color: isStaff ? "#c2410c" : "#1d4ed8",
  borderColor: isStaff ? "#fdba74" : "#bfdbfe",
});

export function TeacherList({
  teachers,
  loading,
  onView,
  onEdit,
  onDelete,
}: {
  teachers: Teacher[];
  loading: boolean;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacherId: number) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const isNonTeachingStaff = (teacher: Teacher) =>
    Boolean(teacher.is_staff ?? teacher.login_is_staff);

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <section className="teacherListCard" style={cardStyle}>
      {/* <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Teacher List</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>Compact teacher list with the same scan-first table pattern as students.</p>
      </div> */}

      {loading ? (
        <div>Loading teachers...</div>
      ) : teachers.length === 0 ? (
        <div style={{ color: "#6b7280" }}>No teachers created yet.</div>
      ) : (
        <div className="dataTableWrap teacherListTableWrap" style={{ overflowX: "auto" }}>
          <table className="dataTable teacherListTable">
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={tableCellStyle}>Sl No</th>
                <th style={tableCellStyle}>Name</th>
                <th style={tableCellStyle}>Type</th>
                <th style={tableCellStyle}>Class / Subject</th>
                <th style={tableCellStyle}>Contact</th>
                <th style={tableCellStyle}>Join Date</th>
                <th style={tableCellStyle}>Status</th>
                <th style={tableCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, index) => {
                const isStaff = isNonTeachingStaff(teacher);

                return (
                  <tr key={teacher.id} className="dataTable__row" onClick={() => onView(teacher)}>
                  <td style={tableCellStyle}>{index + 1}</td>
                  <td style={tableCellStyle}>
                    <div className="dataTable__strong">{teacher.name}</div>
                    <div className="dataTable__subtle">
                      {[teacher.qualification, teacher.experience].filter(Boolean).join(" | ") || "No qualification added"}
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={roleBadgeStyle(isStaff)}>
                      {isStaff ? "Non-teaching staff" : "Teacher"}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <div className="dataTable__strong">
                      {(teacher.assigned_classes || []).slice(0, 2).join(", ") || "No class assigned"}
                    </div>
                    <div className="dataTable__subtle">
                      {(teacher.assigned_subjects || []).slice(0, 2).join(", ") || "No subject assigned"}
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <div className="dataTable__strong">{teacher.phone || "-"}</div>
                    <div className="dataTable__subtle">{teacher.email || "-"}</div>
                  </td>
                  <td style={tableCellStyle}>{teacher.join_date ? new Date(teacher.join_date).toLocaleDateString() : "-"}</td>
                  <td style={tableCellStyle}>
                    <span
                      className={`dataTableStatusPill dataTableStatusPill--${teacher.status === "active" ? "active" : "inactive"}`}
                    >
                      {teacher.status}
                    </span>
                  </td>
                  <td style={{ ...tableCellStyle, position: "relative" }}>
                    <div className="dataTableActionMenu" onClick={(event) => event.stopPropagation()}>
                      <button
                        className="dataTableActionTrigger"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(openMenuId === teacher.id ? null : teacher.id);
                        }}
                      >
                        <img src={Content} alt="menu" style={{ width: 18, height: 18 }} />
                      </button>
                      {openMenuId === teacher.id ? (
                        <div className="dataTableActionDropdown">
                          <button onClick={() => onView(teacher)}>View</button>
                          <button onClick={() => onEdit(teacher)}>Edit</button>
                          <button onClick={() => onDelete(teacher.id)} data-danger="true">Delete</button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
