import type { Hostel, Room } from "../types/hostel.types";
import Content from "../../../assets/Content.png";

const cellHeader = {
  textAlign: "left" as const,
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
};

const cell = {
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
};

const menuStyle = {
  position: "absolute" as const,
  top: "calc(100% + 6px)",
  right: 0,
  minWidth: 170,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)",
  padding: 6,
  zIndex: 20,
};

const menuItemButton = {
  width: "100%",
  textAlign: "left" as const,
  background: "transparent",
  color: "#111827",
  border: "none",
  borderRadius: 8,
  padding: "10px 12px",
  fontWeight: 600,
  cursor: "pointer",
};

const dangerMenuItemButton = {
  ...menuItemButton,
  color: "#b91c1c",
};

export function RoomAvailabilityTable({
  hostels,
  rooms,
  selectedHostelFilter,
  setSelectedHostelFilter,
  openRoomActionId,
  setOpenRoomActionId,
  onEditHostel,
  onEditRoom,
  onDeleteRoom,
  onDeleteHostel,
}: {
  hostels: Hostel[];
  rooms: Room[];
  selectedHostelFilter: string;
  setSelectedHostelFilter: (value: string) => void;
  openRoomActionId: number | null;
  setOpenRoomActionId: (value: number | null | ((current: number | null) => number | null)) => void;
  onEditHostel: (hostelId: number) => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: number) => void;
  onDeleteHostel: (hostelId: number) => void;
}) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Hostel Room Availability</h2>
        <select value={selectedHostelFilter} onChange={(e) => setSelectedHostelFilter(e.target.value)} style={{ width: 260, padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db" }}>
          <option value="">All hostels</option>
          {hostels.map((hostel) => (
            <option key={hostel.id} value={hostel.id}>{hostel.hostel_name}</option>
          ))}
        </select>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["ID", "Hostel", "Room", "Capacity", "Category", "Availability", "Actions"].map((item) => (
                <th key={item} style={cellHeader}>{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td style={cell}>{room.id}</td>
                <td style={cell}>{room.hostel_name}</td>
                <td style={cell}>{room.room_number}</td>
                <td style={cell}>{room.capacity}</td>
                <td style={cell}>{room.type || "-"}</td>
                <td style={cell}>{Number(room.vacant_seats || 0) > 0 ? `Vacant ${room.vacant_seats}` : "Full"}</td>
                <td style={cell}>
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenRoomActionId((current) =>
                          current === room.id ? null : room.id
                        );
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 6,
                        cursor: "pointer",
                        borderRadius: 6,
                      }}
                    >
                      <img
                        src={Content}
                        alt="menu"
                        style={{ width: 18, height: 18 }}
                      />
                    </button>

                    {openRoomActionId === room.id && (
                      <div style={menuStyle}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenRoomActionId(null);
                            onEditHostel(room.hostel_id);
                          }}
                          style={menuItemButton}
                        >
                          Edit Hostel
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenRoomActionId(null);
                            onEditRoom(room);
                          }}
                          style={menuItemButton}
                        >
                          Edit Room
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenRoomActionId(null);
                            onDeleteRoom(room.id);
                          }}
                          style={dangerMenuItemButton}
                        >
                          Delete Room
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenRoomActionId(null);
                            onDeleteHostel(room.hostel_id);
                          }}
                          style={dangerMenuItemButton}
                        >
                          Delete Hostel
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
