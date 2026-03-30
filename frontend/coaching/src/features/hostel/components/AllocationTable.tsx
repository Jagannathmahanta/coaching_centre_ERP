import type { Allocation } from "../types/hostel.types";

const cellHeader = {
  textAlign: "left" as const,
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
};

const cell = {
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
};

const dangerMiniButton = {
  background: "#fff",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

export function AllocationTable({
  allocations,
  onReleaseAllocation,
}: {
  allocations: Allocation[];
  onReleaseAllocation: (allocationId: number) => void;
}) {
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Hostel Wise Student List</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Student", "Admission No", "Class", "Hostel", "Room", "Join Date", "Actions"].map((item) => (
                <th key={item} style={cellHeader}>{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allocations.map((allocation) => (
              <tr key={allocation.id}>
                <td style={cell}>{allocation.student_name}</td>
                <td style={cell}>{allocation.roll_number || "-"}</td>
                <td style={cell}>{allocation.class}</td>
                <td style={cell}>{allocation.hostel_name || "-"}</td>
                <td style={cell}>{allocation.room_number || "-"}</td>
                <td style={cell}>{new Date(allocation.start_date).toLocaleDateString()}</td>
                <td style={cell}>
                  <button type="button" onClick={() => onReleaseAllocation(allocation.id)} style={dangerMiniButton}>
                    Vacate Seat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
