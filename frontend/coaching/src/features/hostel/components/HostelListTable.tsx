import { useState } from "react";
import type { Hostel, Room } from "../types/hostel.types";

const cellHeader = {
  textAlign: "left" as const,
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
  fontSize: 13,
  color: "#475569",
};

const cell = {
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top" as const,
};

const actionButton = {
  background: "#f8fafc",
  color: "#111827",
  border: "1px solid #dbe3ee",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 600,
  cursor: "pointer",
};

const dangerButton = {
  ...actionButton,
  color: "#b91c1c",
  border: "1px solid #fecaca",
  background: "#fff",
};

const statusBadge = (status: string) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  textTransform: "capitalize" as const,
  background: status === "active" ? "#dcfce7" : "#f3f4f6",
  color: status === "active" ? "#166534" : "#475569",
});

function formatCount(value: string | number | undefined) {
  return Number(value || 0);
}

export function HostelListTable({
  hostels,
  rooms,
  onEditHostel,
  onEditRoom,
  onDeleteHostel,
  onDeleteRoom,
}: {
  hostels: Hostel[];
  rooms: Room[];
  onEditHostel: (hostelId: number) => void;
  onEditRoom: (room: Room) => void;
  onDeleteHostel: (hostelId: number) => void;
  onDeleteRoom: (roomId: number) => void;
}) {
  const [expandedHostelId, setExpandedHostelId] = useState<number | null>(null);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Hostel List</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Expand a hostel row to see existing rooms and edit them.
          </p>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
          <thead>
            <tr>
              <th style={cellHeader}>Hostel</th>
              <th style={cellHeader}>Type</th>
              <th style={cellHeader}>Address</th>
              <th style={cellHeader}>Rooms</th>
              <th style={cellHeader}>Capacity</th>
              <th style={cellHeader}>Occupied</th>
              <th style={cellHeader}>Vacant</th>
              <th style={cellHeader}>Status</th>
              <th style={cellHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hostels.map((hostel) => {
              const hostelRooms = rooms.filter((room) => room.hostel_id === hostel.id);
              const isExpanded = expandedHostelId === hostel.id;

              return (
                <FragmentRow
                  key={hostel.id}
                  hostel={hostel}
                  hostelRooms={hostelRooms}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedHostelId(isExpanded ? null : hostel.id)}
                  onEditHostel={onEditHostel}
                  onEditRoom={onEditRoom}
                  onDeleteHostel={onDeleteHostel}
                  onDeleteRoom={onDeleteRoom}
                />
              );
            })}

            {!hostels.length && (
              <tr>
                <td style={{ ...cell, textAlign: "center", color: "#6b7280" }} colSpan={9}>
                  No hostels found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FragmentRow({
  hostel,
  hostelRooms,
  isExpanded,
  onToggle,
  onEditHostel,
  onEditRoom,
  onDeleteHostel,
  onDeleteRoom,
}: {
  hostel: Hostel;
  hostelRooms: Room[];
  isExpanded: boolean;
  onToggle: () => void;
  onEditHostel: (hostelId: number) => void;
  onEditRoom: (room: Room) => void;
  onDeleteHostel: (hostelId: number) => void;
  onDeleteRoom: (roomId: number) => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          cursor: "pointer",
          background: isExpanded ? "#fcfcfd" : "#fff",
        whiteSpace: "nowrap",
        }}
      >
        <td style={cell}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 34, color: "#334155" }}>{isExpanded ? "▾" : "▸"}</span>
            <div>
              <div style={{ fontWeight: 700, color: "#111827" }}>{hostel.hostel_name}</div>
              {/* <div style={{ fontSize: 12, color: "#6b7280" }}>ID #{hostel.id}</div> */}
            </div>
          </div>
        </td>
        <td style={{ ...cell, textTransform: "capitalize" }}>
          {hostel.gender_type}
        </td>
        <td style={cell}>{hostel.address || "-"}</td>
        <td style={cell}>{formatCount(hostel.total_rooms)}</td>
        <td style={cell}>{formatCount(hostel.total_capacity)}</td>
        <td style={cell}>{formatCount(hostel.occupied_beds)}</td>
        <td style={cell}>{formatCount(hostel.vacant_beds)}</td>
        <td style={cell}>
          <span style={statusBadge(hostel.status)}>{hostel.status}</span>
        </td>
        <td style={cell}>
          <div
            style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onEditHostel(hostel.id)}
              style={actionButton}
            >
              Edit Hostel
            </button>
            <button
              type="button"
              onClick={() => onDeleteHostel(hostel.id)}
              style={dangerButton}
            >
              Delete Hostel
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={9} style={{ ...cell, background: "#f8fafc" }}>
            <div style={{ padding: "4px 0" }}>
              <div style={{ fontWeight: 700, color: "#111827", marginBottom: 12 }}>
                Existing Rooms
              </div>

              {hostelRooms.length ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12 }}>
                    <thead>
                      <tr>
                        <th style={cellHeader}>Room</th>
                        <th style={cellHeader}>Floor</th>
                        <th style={cellHeader}>Category</th>
                        <th style={cellHeader}>Capacity</th>
                        <th style={cellHeader}>Occupied</th>
                        <th style={cellHeader}>Vacant</th>
                        <th style={cellHeader}>Status</th>
                        <th style={cellHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostelRooms.map((room) => (
                        <tr key={room.id}>
                          <td style={cell}>{room.room_number}</td>
                          <td style={cell}>{room.floor || "-"}</td>
                          <td style={{ ...cell, textTransform: "capitalize" }}>{room.type || "-"}</td>
                          <td style={cell}>{room.capacity}</td>
                          <td style={cell}>{room.occupied}</td>
                          <td style={cell}>{formatCount(room.vacant_seats)}</td>
                          <td style={cell}>
                            <span style={statusBadge(room.status)}>{room.status}</span>
                          </td>
                          <td style={cell}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                onClick={() => onEditRoom(room)}
                                style={actionButton}
                              >
                                Edit Room
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRoom(room.id)}
                                style={dangerButton}
                              >
                                Delete Room
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: "#6b7280" }}>No rooms found for this hostel.</div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
