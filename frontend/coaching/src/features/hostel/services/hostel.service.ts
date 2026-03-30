import api from "../../../shared/services/api";
import type { HostelFormValues, RoomDraft, RoomFormValues } from "../types/hostel.types";

export async function getHostelDashboard() {
  const [hostels, rooms, allocations] = await Promise.all([
    api.get("/hostel"),
    api.get("/hostel/rooms/list"),
    api.get("/hostel/allocations/list", { params: { active_only: true } }),
  ]);

  return {
    hostels: hostels.data || [],
    rooms: rooms.data || [],
    allocations: allocations.data || [],
  };
}

export async function saveHostelWithRooms(
  editingHostelId: number | null,
  hostelForm: HostelFormValues,
  roomDrafts: RoomDraft[]
) {
  if (editingHostelId) {
    const response = await api.patch(`/hostel/${editingHostelId}`, hostelForm);
    return response.data;
  }

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

  return { hostelId, roomCount: validRooms.length };
}

export async function saveRoom(editingRoomId: number | null, editingRoomForm: RoomFormValues) {
  const payload = {
    ...editingRoomForm,
    hostel_id: Number(editingRoomForm.hostel_id),
    capacity: Number(editingRoomForm.capacity),
    monthly_fee: editingRoomForm.monthly_fee ? Number(editingRoomForm.monthly_fee) : null,
  };

  if (editingRoomId) {
    const response = await api.patch(`/hostel/rooms/${editingRoomId}`, payload);
    return response.data;
  }

  const response = await api.post("/hostel/rooms", payload);
  return response.data;
}

export async function deleteHostel(hostelId: number) {
  const response = await api.delete(`/hostel/${hostelId}`);
  return response.data;
}

export async function deleteRoom(roomId: number) {
  const response = await api.delete(`/hostel/rooms/${roomId}`);
  return response.data;
}

export async function releaseAllocation(allocationId: number) {
  const response = await api.patch(`/hostel/allocations/${allocationId}/release`, {
    end_date: new Date().toISOString().slice(0, 10),
  });
  return response.data;
}
