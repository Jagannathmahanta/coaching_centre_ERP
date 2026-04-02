import { useEffect, useState } from "react";
import type { StudentRecord } from "../types/students.types";
import Content from "../../../assets/Content.png";
import "../../../shared/styles/dataTable.css";
import "./StudentTable.css";

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

const tableCellStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left" as const,
  verticalAlign: "top" as const,
};

export function StudentTable({
  students,
  onView,
  onEdit,
  onDelete,
  onCreateLogin,
}: {
  students: StudentRecord[];
  onView: (student: StudentRecord) => void;
  onEdit: (studentId: number) => void;
  onDelete: (studentId: number) => void;
  onCreateLogin: (student: StudentRecord) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  if (students.length === 0) {
    return <div style={cardStyle}>No students found yet.</div>;
  }

  return (
    <div className="dataTableWrap studentTableWrap" style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
      <table className="dataTable studentTable">
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={tableCellStyle}>Sl No</th>
            <th style={tableCellStyle}>Name / Admission No</th>
            <th style={tableCellStyle}>Class / Course</th>
            <th style={tableCellStyle}>Admission Date</th>
            <th style={tableCellStyle}>Contact</th>
            <th style={tableCellStyle}>Status</th>
            <th style={tableCellStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.id} className="dataTable__row studentTable__row" onClick={() => onView(student)}>
              <td style={tableCellStyle}>{index + 1}</td>
              <td style={tableCellStyle}>
                <div className="dataTable__strong">{student.name}</div>
                <div className="dataTable__subtle">Admission No: {student.roll_number || "-"}</div>
              </td>
              <td style={tableCellStyle}>
                <div className="dataTable__strong">{student.class || "-"}</div>
                <div className="dataTable__subtle">{student.board || ""}</div>
              </td>
              <td style={tableCellStyle}>{student.join_date ? new Date(student.join_date).toLocaleDateString() : "-"}</td>
              <td style={tableCellStyle}>
                <div className="dataTable__strong">{student.phone || "-"}</div>
                <div className="dataTable__subtle">{student.email || "-"}</div>
              </td>
              <td style={tableCellStyle}>
                <span className={`dataTableStatusPill studentStatusPill studentStatusPill--${(student.status || "active").toLowerCase()}`}>
                  {student.status || "active"}
                </span>
              </td>
              <td style={{ ...tableCellStyle, position: "relative" }}>
                <div className="dataTableActionMenu" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="dataTableActionTrigger"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId(openMenuId === student.id ? null : student.id);
                    }}
                  >
                    <img src={Content} alt="menu" style={{ width: 18, height: 18 }} />
                  </button>

                  {openMenuId === student.id ? (
                    <div className="dataTableActionDropdown">
                      <button onClick={() => onView(student)}>View</button>
                      <button onClick={() => onEdit(student.id)}>Edit</button>
                      {!student.has_login_account ? <button onClick={() => onCreateLogin(student)}>Create Login</button> : null}
                      <button onClick={() => onDelete(student.id)} data-danger="true">Permanent Delete</button>
                    </div>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
