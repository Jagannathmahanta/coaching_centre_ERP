import { AllocationTable } from "../components/AllocationTable";
import { HostelFormsSection } from "../components/HostelFormsSection";
import { RoomAvailabilityTable } from "../components/RoomAvailabilityTable";
import { useHostelData } from "../hooks/useHostelData";

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
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

export default function HostelPage() {
  const state = useHostelData();

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Hostel Management</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Create boys and girls hostels, add rooms, and manage active hostel seat allocations.
        </p>
      </div>

      {state.message && <div style={{ ...cardStyle, color: "#166534", background: "#f0fdf4" }}>{state.message}</div>}
      {state.error && <div style={{ ...cardStyle, color: "#b91c1c", background: "#fef2f2" }}>{state.error}</div>}

      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Hostel Listings</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Keep the page focused on rooms and allocations. Open the form only when you need to add or edit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            state.resetRoomForm();
            state.setEditingHostelId(null);
            state.setHostelForm({ hostel_name: "", gender_type: "boys", address: "", status: "active" });
            state.setRoomDrafts([{ room_number: "", floor: "", type: "double", capacity: "2", monthly_fee: "", status: "active" }]);
            state.setShowHostelForm(true);
          }}
          style={primaryButton}
        >
          Add Hostel
        </button>
      </div>

      <HostelFormsSection
        hostels={state.hostels}
        showHostelForm={state.showHostelForm}
        editingHostelId={state.editingHostelId}
        editingRoomId={state.editingRoomId}
        hostelForm={state.hostelForm}
        setHostelForm={state.setHostelForm}
        roomDrafts={state.roomDrafts}
        setRoomDrafts={state.setRoomDrafts}
        editingRoomForm={state.editingRoomForm}
        setEditingRoomForm={state.setEditingRoomForm}
        resetHostelForm={state.resetHostelForm}
        resetRoomForm={state.resetRoomForm}
        onSaveHostel={state.handleSaveHostel}
        onSaveRoom={state.handleSaveRoom}
      />

      {state.loading ? (
        <div style={cardStyle}>Loading hostel data...</div>
      ) : (
        <>
          <div style={cardStyle}>
            <RoomAvailabilityTable
              hostels={state.hostels}
              rooms={state.filteredRooms}
              selectedHostelFilter={state.selectedHostelFilter}
              setSelectedHostelFilter={state.setSelectedHostelFilter}
              openRoomActionId={state.openRoomActionId}
              setOpenRoomActionId={state.setOpenRoomActionId}
              onEditHostel={(hostelId) => {
                const hostel = state.hostels.find((item) => item.id === hostelId);
                if (!hostel) return;
                state.setShowHostelForm(true);
                state.setEditingHostelId(hostel.id);
                state.setHostelForm({
                  hostel_name: hostel.hostel_name,
                  gender_type: hostel.gender_type,
                  address: hostel.address || "",
                  status: hostel.status,
                });
              }}
              onEditRoom={(room) => {
                state.setEditingRoomId(room.id);
                state.setEditingRoomForm({
                  hostel_id: String(room.hostel_id),
                  room_number: room.room_number,
                  floor: room.floor || "",
                  type: room.type || "double",
                  capacity: String(room.capacity),
                  monthly_fee: "",
                  status: room.status,
                });
              }}
              onDeleteRoom={state.handleDeleteRoom}
              onDeleteHostel={state.handleDeleteHostel}
            />
          </div>

          <div style={cardStyle}>
            <AllocationTable allocations={state.allocations} onReleaseAllocation={state.handleReleaseAllocation} />
          </div>
        </>
      )}
    </div>
  );
}
