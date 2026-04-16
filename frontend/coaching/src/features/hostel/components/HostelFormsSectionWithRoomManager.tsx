import type { ReactNode } from "react";
import type { Hostel, HostelFormValues, Room, RoomDraft, RoomFormValues } from "../types/hostel.types";

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
  marginTop: 6,
  boxSizing: "border-box" as const,
};

const primaryButton = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  background: "#f3f4f6",
  color: "#111827",
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
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

const roomCardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
  background: "#f8fafc",
};

export function HostelFormsSectionWithRoomManager({
  hostels,
  rooms,
  showHostelForm,
  editingHostelId,
  editingRoomId,
  hostelForm,
  setHostelForm,
  roomDrafts,
  setRoomDrafts,
  editingRoomForm,
  setEditingRoomForm,
  setEditingRoomId,
  resetRoomForm,
  onSaveHostel,
  onSaveRoom,
  onDeleteRoom,
}: {
  hostels: Hostel[];
  rooms: Room[];
  showHostelForm: boolean;
  editingHostelId: number | null;
  editingRoomId: number | null;
  hostelForm: HostelFormValues;
  setHostelForm: React.Dispatch<React.SetStateAction<HostelFormValues>>;
  roomDrafts: RoomDraft[];
  setRoomDrafts: React.Dispatch<React.SetStateAction<RoomDraft[]>>;
  editingRoomForm: RoomFormValues;
  setEditingRoomForm: React.Dispatch<React.SetStateAction<RoomFormValues>>;
  setEditingRoomId: React.Dispatch<React.SetStateAction<number | null>>;
  resetRoomForm: () => void;
  onSaveHostel: () => void;
  onSaveRoom: () => void;
  onDeleteRoom: (roomId: number) => void;
}) {
  const existingRooms = editingHostelId
    ? rooms.filter((room) => room.hostel_id === editingHostelId)
    : [];

  const showRoomForm =
    Boolean(editingRoomId) ||
    Boolean(editingHostelId && editingRoomForm.hostel_id === String(editingHostelId));

  if (!(showHostelForm || editingHostelId || showRoomForm)) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: showRoomForm ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr",
        gap: 20,
      }}
    >
      {(showHostelForm || editingHostelId) && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSaveHostel();
          }}
          style={cardStyle}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0 }}>
              {editingHostelId ? "Edit Hostel" : "Create Hostel With Rooms"}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
            }}
          >
            <Field label="Hostel Name">
              <input
                value={hostelForm.hostel_name}
                onChange={(event) =>
                  setHostelForm((state) => ({
                    ...state,
                    hostel_name: event.target.value,
                  }))
                }
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Hostel Type">
              <select
                value={hostelForm.gender_type}
                onChange={(event) =>
                  setHostelForm((state) => ({
                    ...state,
                    gender_type: event.target.value as "boys" | "girls",
                  }))
                }
                style={inputStyle}
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </Field>

            <Field label="Address">
              <input
                value={hostelForm.address}
                onChange={(event) =>
                  setHostelForm((state) => ({
                    ...state,
                    address: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Status">
              <select
                value={hostelForm.status}
                onChange={(event) =>
                  setHostelForm((state) => ({
                    ...state,
                    status: event.target.value,
                  }))
                }
                style={inputStyle}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          {!editingHostelId && (
            <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ margin: 0 }}>Rooms To Create</h3>

                <button
                  type="button"
                  onClick={() =>
                    setRoomDrafts((current) => [
                      ...current,
                      {
                        room_number: "",
                        floor: "",
                        type: "double",
                        capacity: "2",
                        monthly_fee: "",
                        status: "active",
                      },
                    ])
                  }
                  style={secondaryButton}
                >
                  Add Room
                </button>
              </div>

              {roomDrafts.map((room, index) => (
                <div key={index} style={roomCardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <strong>Room {index + 1}</strong>

                    {roomDrafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setRoomDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))
                        }
                        style={dangerMiniButton}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <RoomDraftFields
                    room={room}
                    onChange={(updater) =>
                      setRoomDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, ...updater(item) } : item
                        )
                      )
                    }
                  />
                </div>
              ))}

              <div style={{ marginTop: 20 }}>
                <button
                  type="submit"
                  style={{
                    ...primaryButton,
                    width: "250px",
                    fontSize: 16,
                    padding: "14px",
                  }}
                >
                  Create Hostel & All Rooms
                </button>

                <p
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginTop: 6,
                    textAlign: "center",
                  }}
                >
                  This will create the hostel along with all rooms at once.
                </p>
              </div>
            </div>
          )}

          {editingHostelId && (
            <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
              <div style={{ marginTop: 4 }}>
                <button
                  type="submit"
                  style={{
                    ...primaryButton,
                    width: "100%",
                    fontSize: 16,
                    padding: "14px",
                  }}
                >
                  Update Hostel
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>Existing Rooms</h3>
                  <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                    Add new rooms later or edit/delete current rooms for this hostel.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingRoomId(null);
                    setEditingRoomForm({
                      hostel_id: String(editingHostelId),
                      room_number: "",
                      floor: "",
                      type: "double",
                      capacity: "2",
                      monthly_fee: "",
                      status: "active",
                    });
                  }}
                  style={secondaryButton}
                >
                  Add Room To Hostel
                </button>
              </div>

              {existingRooms.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {existingRooms.map((room) => (
                    <div
                      key={room.id}
                      style={{
                        ...roomCardStyle,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <strong style={{ color: "#111827" }}>
                          Room {room.room_number}
                        </strong>
                        <span style={{ color: "#6b7280", fontSize: 14 }}>
                          Floor: {room.floor || "-"} | Type: {room.type || "-"} | Capacity: {room.capacity}
                        </span>
                        <span style={{ color: "#6b7280", fontSize: 14 }}>
                          Occupied: {room.occupied} | Vacant: {Number(room.vacant_seats || 0)} | Status: {room.status}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoomId(room.id);
                            setEditingRoomForm({
                              hostel_id: String(room.hostel_id),
                              room_number: room.room_number,
                              floor: room.floor || "",
                              type: room.type || "double",
                              capacity: String(room.capacity),
                              monthly_fee: "",
                              status: room.status,
                            });
                          }}
                          style={secondaryButton}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteRoom(room.id)}
                          style={dangerMiniButton}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ ...roomCardStyle, color: "#6b7280" }}>
                  No rooms added yet for this hostel.
                </div>
              )}
            </div>
          )}
        </form>
      )}

      {showRoomForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSaveRoom();
          }}
          style={cardStyle}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0 }}>{editingRoomId ? "Edit Room" : "Add Room"}</h2>
            <button type="button" onClick={resetRoomForm} style={secondaryButton}>
              Close
            </button>
          </div>

          <Field label="Hostel">
            <select
              value={editingRoomForm.hostel_id}
              onChange={(event) =>
                setEditingRoomForm((state) => ({ ...state, hostel_id: event.target.value }))
              }
              required
              style={inputStyle}
            >
              <option value="">Select hostel</option>
              {hostels.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.hostel_name} • {hostel.gender_type}
                </option>
              ))}
            </select>
          </Field>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginTop: 14,
            }}
          >
            <Field label="Room Number">
              <input
                value={editingRoomForm.room_number}
                onChange={(event) =>
                  setEditingRoomForm((state) => ({ ...state, room_number: event.target.value }))
                }
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Floor">
              <input
                value={editingRoomForm.floor}
                onChange={(event) =>
                  setEditingRoomForm((state) => ({ ...state, floor: event.target.value }))
                }
                style={inputStyle}
              />
            </Field>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 12,
              marginTop: 14,
            }}
          >
            <Field label="Category">
              <select
                value={editingRoomForm.type}
                onChange={(event) =>
                  setEditingRoomForm((state) => ({ ...state, type: event.target.value }))
                }
                style={inputStyle}
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="dormitory">Dormitory</option>
              </select>
            </Field>

            <Field label="Capacity">
              <input
                type="number"
                min="1"
                value={editingRoomForm.capacity}
                onChange={(event) =>
                  setEditingRoomForm((state) => ({ ...state, capacity: event.target.value }))
                }
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Monthly Fee">
              <input
                type="number"
                min="0"
                value={editingRoomForm.monthly_fee}
                onChange={(event) =>
                  setEditingRoomForm((state) => ({ ...state, monthly_fee: event.target.value }))
                }
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field label="Status">
              <select
                value={editingRoomForm.status}
                onChange={(event) =>
                  setEditingRoomForm((state) => ({ ...state, status: event.target.value }))
                }
                style={inputStyle}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <div style={{ marginTop: 18 }}>
            <button type="submit" style={primaryButton}>
              {editingRoomId ? "Update Room" : "Create Room"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function RoomDraftFields({
  room,
  onChange,
}: {
  room: RoomDraft;
  onChange: (updater: (current: RoomDraft) => Partial<RoomDraft>) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
      }}
    >
      <Field label="Room Number">
        <input
          value={room.room_number}
          onChange={(event) => onChange(() => ({ room_number: event.target.value }))}
          style={inputStyle}
        />
      </Field>

      <Field label="Floor">
        <input
          value={room.floor}
          onChange={(event) => onChange(() => ({ floor: event.target.value }))}
          style={inputStyle}
        />
      </Field>

      <Field label="Category">
        <select
          value={room.type}
          onChange={(event) => onChange(() => ({ type: event.target.value }))}
          style={inputStyle}
        >
          <option value="single">Single</option>
          <option value="double">Double</option>
          <option value="triple">Triple</option>
          <option value="dormitory">Dormitory</option>
        </select>
      </Field>

      <Field label="Capacity">
        <input
          type="number"
          min="1"
          value={room.capacity}
          onChange={(event) => onChange(() => ({ capacity: event.target.value }))}
          style={inputStyle}
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        color: "#374151",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {label}
      {children}
    </label>
  );
}
