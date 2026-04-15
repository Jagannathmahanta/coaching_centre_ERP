import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

type Hostel = {
  id: number;
  hostel_name: string;
  gender_type: "boys" | "girls";
  address?: string | null;
  status: string;
  total_rooms?: string | number;
  total_capacity?: string | number;
  occupied_beds?: string | number;
  vacant_beds?: string | number;
};

type Room = {
  id: number;
  hostel_id: number;
  hostel_name: string;
  gender_type: "boys" | "girls";
  room_number: string;
  floor?: string | null;
  type?: string | null;
  capacity: number;
  occupied: number;
  vacant_seats?: string | number;
  status: string;
};

type Allocation = {
  id: number;
  student_id: number;
  student_name: string;
  class: string;
  roll_number?: string | null;
  hostel_name?: string | null;
  room_number?: string | null;
  start_date: string;
  end_date?: string | null;
  status: string;
};

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
};

export default function HostelPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedHostelFilter, setSelectedHostelFilter] = useState("");
  const [showHostelForm, setShowHostelForm] = useState(false);
  const [openRoomActionId, setOpenRoomActionId] = useState<number | null>(null);
  const [hostelForm, setHostelForm] = useState({
    hostel_name: "",
    gender_type: "boys",
    address: "",
    status: "active",
  });
  const [roomDrafts, setRoomDrafts] = useState([
    { room_number: "", floor: "", type: "double", capacity: "2", monthly_fee: "", status: "active" },
  ]);
  const [editingHostelId, setEditingHostelId] = useState<number | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingRoomForm, setEditingRoomForm] = useState({
    hostel_id: "",
    room_number: "",
    floor: "",
    type: "double",
    capacity: "2",
    monthly_fee: "",
    status: "active",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPage = async () => {
    setLoading(true);
    setError("");
    try {
      const [hostelsRes, roomsRes, allocationsRes] = await Promise.all([
        api.get("/hostel"),
        api.get("/hostel/rooms/list"),
        api.get("/hostel/allocations/list", { params: { active_only: true } }),
      ]);
      setHostels(hostelsRes.data || []);
      setRooms(roomsRes.data || []);
      setAllocations(allocationsRes.data || []);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error || "Failed to load hostel data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const filteredRooms = useMemo(
    () => rooms.filter((room) => !selectedHostelFilter || String(room.hostel_id) === selectedHostelFilter),
    [rooms, selectedHostelFilter]
  );

  const resetHostelForm = () => {
    setEditingHostelId(null);
    setHostelForm({ hostel_name: "", gender_type: "boys", address: "", status: "active" });
    setRoomDrafts([{ room_number: "", floor: "", type: "double", capacity: "2", monthly_fee: "", status: "active" }]);
    setShowHostelForm(false);
  };

  const resetRoomForm = () => {
    setEditingRoomId(null);
    setEditingRoomForm({
      hostel_id: "",
      room_number: "",
      floor: "",
      type: "double",
      capacity: "2",
      monthly_fee: "",
      status: "active",
    });
  };

  const handleSaveHostel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingHostelId) {
        await api.patch(`/hostel/${editingHostelId}`, hostelForm);
        setMessage("Hostel updated.");
      } else {
        const hostelResponse = await api.post("/hostel", hostelForm);
        const hostelId = hostelResponse.data?.id;

        const validRooms = roomDrafts.filter((room) => room.room_number.trim() && Number(room.capacity) > 0);
        for (const room of validRooms) {
          await api.post("/hostel/rooms", {
            hostel_id: hostelId,
            room_number: room.room_number,
            floor: room.floor || null,
            type: room.type || null,
            capacity: Number(room.capacity),
            monthly_fee: room.monthly_fee ? Number(room.monthly_fee) : null,
            status: room.status,
          });
        }

        setMessage(validRooms.length > 0 ? "Hostel and rooms created." : "Hostel created.");
      }
      resetHostelForm();
      await loadPage();
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || "Failed to save hostel.");
    }
  };

  const handleSaveRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const payload = {
        ...editingRoomForm,
        hostel_id: Number(editingRoomForm.hostel_id),
        capacity: Number(editingRoomForm.capacity),
        monthly_fee: editingRoomForm.monthly_fee ? Number(editingRoomForm.monthly_fee) : null,
      };
      if (editingRoomId) {
        await api.patch(`/hostel/rooms/${editingRoomId}`, payload);
        setMessage("Room updated.");
      } else {
        await api.post("/hostel/rooms", payload);
        setMessage("Room created.");
      }
      resetRoomForm();
      await loadPage();
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || "Failed to save room.");
    }
  };

  const handleDeleteHostel = async (hostelId: number) => {
    if (!window.confirm("Delete this hostel?")) return;
    try {
      await api.delete(`/hostel/${hostelId}`);
      setMessage("Hostel deleted.");
      await loadPage();
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.error || "Failed to delete hostel.");
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!window.confirm("Delete this room?")) return;
    try {
      await api.delete(`/hostel/rooms/${roomId}`);
      setMessage("Room deleted.");
      await loadPage();
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.error || "Failed to delete room.");
    }
  };

  const handleReleaseAllocation = async (allocationId: number) => {
    if (!window.confirm("Release this hostel seat?")) return;
    try {
      await api.patch(`/hostel/allocations/${allocationId}/release`, {
        end_date: new Date().toISOString().slice(0, 10),
      });
      setMessage("Seat released and marked vacant.");
      await loadPage();
    } catch (releaseError: any) {
      setError(releaseError.response?.data?.error || "Failed to release hostel seat.");
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Hostel Management</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Create boys and girls hostels, add rooms, and manage active hostel seat allocations.
        </p>
      </div>

      {message && <div style={{ ...cardStyle, color: "#166534", background: "#f0fdf4" }}>{message}</div>}
      {error && <div style={{ ...cardStyle, color: "#b91c1c", background: "#fef2f2" }}>{error}</div>}

      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "nowrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Hostel Listings</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Keep the page focused on rooms and allocations. Open the form only when you need to add or edit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetRoomForm();
            setEditingHostelId(null);
            setHostelForm({ hostel_name: "", gender_type: "boys", address: "", status: "active" });
            setRoomDrafts([{ room_number: "", floor: "", type: "double", capacity: "2", monthly_fee: "", status: "active" }]);
            setShowHostelForm(true);
          }}
          style={primaryButton}
        >
          Add Hostel
        </button>
      </div>
      {(showHostelForm || editingHostelId || editingRoomId) && (
        <div style={{ display: "grid", gridTemplateColumns: editingRoomId ? "1.2fr 1fr" : "1fr", gap: 20 }}>
          {(showHostelForm || editingHostelId) && (
            <form onSubmit={handleSaveHostel} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0 }}>{editingHostelId ? "Edit Hostel" : "Create Hostel With Rooms"}</h2>
                <button type="button" onClick={resetHostelForm} style={secondaryButton}>
                  Close
                </button>
              </div>
              <Field label="Hostel Name">
                <input value={hostelForm.hostel_name} onChange={(e) => setHostelForm((s) => ({ ...s, hostel_name: e.target.value }))} required style={inputStyle} />
              </Field>
              <Field label="Hostel Type">
                <select value={hostelForm.gender_type} onChange={(e) => setHostelForm((s) => ({ ...s, gender_type: e.target.value as "boys" | "girls" }))} style={inputStyle}>
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                </select>
              </Field>
              <Field label="Address">
                <input value={hostelForm.address} onChange={(e) => setHostelForm((s) => ({ ...s, address: e.target.value }))} style={inputStyle} />
              </Field>
              <Field label="Status">
                <select value={hostelForm.status} onChange={(e) => setHostelForm((s) => ({ ...s, status: e.target.value }))} style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                <button type="submit" style={primaryButton}>{editingHostelId ? "Update Hostel" : "Save Hostel And Rooms"}</button>
              </div>
              {!editingHostelId && (
                <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Rooms To Create</h3>
                    <button
                      type="button"
                      onClick={() => setRoomDrafts((current) => [...current, { room_number: "", floor: "", type: "double", capacity: "2", monthly_fee: "", status: "active" }])}
                      style={secondaryButton}
                    >
                      Add Room
                    </button>
                  </div>
                  {roomDrafts.map((room, index) => (
                    <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <strong>Room {index + 1}</strong>
                        {roomDrafts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRoomDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                            style={dangerMiniButton}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field label="Room Number">
                          <input value={room.room_number} onChange={(e) => setRoomDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, room_number: e.target.value } : item))} style={inputStyle} />
                        </Field>
                        <Field label="Floor">
                          <input value={room.floor} onChange={(e) => setRoomDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, floor: e.target.value } : item))} style={inputStyle} />
                        </Field>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        <Field label="Category">
                          <select value={room.type} onChange={(e) => setRoomDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: e.target.value } : item))} style={inputStyle}>
                            <option value="single">Single</option>
                            <option value="double">Double</option>
                            <option value="triple">Triple</option>
                            <option value="dormitory">Dormitory</option>
                          </select>
                        </Field>
                        <Field label="Capacity">
                          <input type="number" min="1" value={room.capacity} onChange={(e) => setRoomDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, capacity: e.target.value } : item))} style={inputStyle} />
                        </Field>
                        <Field label="Monthly Fee">
                          <input type="number" min="0" value={room.monthly_fee} onChange={(e) => setRoomDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, monthly_fee: e.target.value } : item))} style={inputStyle} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}

          {editingRoomId && (
            <form onSubmit={handleSaveRoom} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0 }}>Edit Room</h2>
                <button type="button" onClick={resetRoomForm} style={secondaryButton}>
                  Close
                </button>
              </div>
              <Field label="Hostel">
                <select value={editingRoomForm.hostel_id} onChange={(e) => setEditingRoomForm((s) => ({ ...s, hostel_id: e.target.value }))} required style={inputStyle}>
                  <option value="">Select hostel</option>
                  {hostels.map((hostel) => (
                    <option key={hostel.id} value={hostel.id}>
                      {hostel.hostel_name} • {hostel.gender_type}
                    </option>
                  ))}
                </select>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Room Number">
                  <input value={editingRoomForm.room_number} onChange={(e) => setEditingRoomForm((s) => ({ ...s, room_number: e.target.value }))} required style={inputStyle} />
                </Field>
                <Field label="Floor">
                  <input value={editingRoomForm.floor} onChange={(e) => setEditingRoomForm((s) => ({ ...s, floor: e.target.value }))} style={inputStyle} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Category">
                  <select value={editingRoomForm.type} onChange={(e) => setEditingRoomForm((s) => ({ ...s, type: e.target.value }))} style={inputStyle}>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                    <option value="dormitory">Dormitory</option>
                  </select>
                </Field>
                <Field label="Capacity">
                  <input type="number" min="1" value={editingRoomForm.capacity} onChange={(e) => setEditingRoomForm((s) => ({ ...s, capacity: e.target.value }))} required style={inputStyle} />
                </Field>
                <Field label="Monthly Fee">
                  <input type="number" min="0" value={editingRoomForm.monthly_fee} onChange={(e) => setEditingRoomForm((s) => ({ ...s, monthly_fee: e.target.value }))} style={inputStyle} />
                </Field>
              </div>
              <Field label="Status">
                <select value={editingRoomForm.status} onChange={(e) => setEditingRoomForm((s) => ({ ...s, status: e.target.value }))} style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                <button type="submit" style={primaryButton}>Update Room</button>
              </div>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <div style={cardStyle}>Loading hostel data...</div>
      ) : (
        <>
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>Hostel Room Availability</h2>
              <select value={selectedHostelFilter} onChange={(e) => setSelectedHostelFilter(e.target.value)} style={{ ...inputStyle, marginTop: 0, maxWidth: 260 }}>
                <option value="">All hostels</option>
                {hostels.map((hostel) => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.hostel_name}
                  </option>
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
                  {filteredRooms.map((room) => (
                    <tr key={room.id}>
                      <td style={cell}>{room.id}</td>
                      <td style={cell}>{room.hostel_name}</td>
                      <td style={cell}>{room.room_number}</td>
                      <td style={cell}>{room.capacity}</td>
                      <td style={cell}>{room.type || "-"}</td>
                      <td style={cell}>
                        {Number(room.vacant_seats || 0) > 0 ? `Vacant ${room.vacant_seats}` : "Full"}
                      </td>
                      <td style={cell}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <button
                            type="button"
                            onClick={() => setOpenRoomActionId((current) => current === room.id ? null : room.id)}
                            style={menuButton}
                          >
                            ...
                          </button>
                          {openRoomActionId === room.id && (
                            <div style={menuStyle}>
                              <button
                                type="button"
                                onClick={() => {
                                  const hostel = hostels.find((item) => item.id === room.hostel_id);
                                  if (!hostel) return;
                                  setOpenRoomActionId(null);
                                  setShowHostelForm(true);
                                  setEditingHostelId(hostel.id);
                                  setHostelForm({
                                    hostel_name: hostel.hostel_name,
                                    gender_type: hostel.gender_type,
                                    address: hostel.address || "",
                                    status: hostel.status,
                                  });
                                }}
                                style={menuItemButton}
                              >
                                Edit Hostel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenRoomActionId(null);
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
                                style={menuItemButton}
                              >
                                Edit Room
                              </button>
                              <button type="button" onClick={() => {
                                setOpenRoomActionId(null);
                                handleDeleteRoom(room.id);
                              }} style={dangerMenuItemButton}>
                                Delete Room
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const hostel = hostels.find((item) => item.id === room.hostel_id);
                                  setOpenRoomActionId(null);
                                  if (hostel) handleDeleteHostel(hostel.id);
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
          </div>

          <div style={cardStyle}>
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
                        <button type="button" onClick={() => handleReleaseAllocation(allocation.id)} style={dangerMiniButton}>
                          Vacate Seat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

const cellHeader = {
  textAlign: "left" as const,
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
};

const cell = {
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
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

const menuButton = {
  background: "#fff",
  color: "#1f2937",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  cursor: "pointer",
  minWidth: 42,
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
