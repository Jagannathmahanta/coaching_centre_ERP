import type { ReactNode } from "react";
import type { Hostel, HostelFormValues, RoomDraft, RoomFormValues } from "../types/hostel.types";

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

export function HostelFormsSection({
  hostels,
  showHostelForm,
  editingHostelId,
  editingRoomId,
  hostelForm,
  setHostelForm,
  roomDrafts,
  setRoomDrafts,
  editingRoomForm,
  setEditingRoomForm,
  resetHostelForm,
  resetRoomForm,
  onSaveHostel,
  onSaveRoom,
}: {
  hostels: Hostel[];
  showHostelForm: boolean;
  editingHostelId: number | null;
  editingRoomId: number | null;
  hostelForm: HostelFormValues;
  setHostelForm: React.Dispatch<React.SetStateAction<HostelFormValues>>;
  roomDrafts: RoomDraft[];
  setRoomDrafts: React.Dispatch<React.SetStateAction<RoomDraft[]>>;
  editingRoomForm: RoomFormValues;
  setEditingRoomForm: React.Dispatch<React.SetStateAction<RoomFormValues>>;
  resetHostelForm: () => void;
  resetRoomForm: () => void;
  onSaveHostel: () => void;
  onSaveRoom: () => void;
}) {
  if (!(showHostelForm || editingHostelId || editingRoomId)) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: editingRoomId ? "1.2fr 1fr" : "1fr", gap: 20 }}>
      {(showHostelForm || editingHostelId) && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSaveHostel();
          }}
          style={cardStyle}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>{editingHostelId ? "Edit Hostel" : "Create Hostel With Rooms"}</h2>
            <button type="button" onClick={resetHostelForm} style={secondaryButton}>Close</button>
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
                      <button type="button" onClick={() => setRoomDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={dangerMiniButton}>
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSaveRoom();
          }}
          style={cardStyle}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Edit Room</h2>
            <button type="button" onClick={resetRoomForm} style={secondaryButton}>Close</button>
          </div>
          <Field label="Hostel">
            <select value={editingRoomForm.hostel_id} onChange={(e) => setEditingRoomForm((s) => ({ ...s, hostel_id: e.target.value }))} required style={inputStyle}>
              <option value="">Select hostel</option>
              {hostels.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>{hostel.hostel_name} • {hostel.gender_type}</option>
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
