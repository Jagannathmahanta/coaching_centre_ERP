import { useEffect, useMemo, useState } from "react";
import {
  deleteHostel,
  deleteRoom,
  getHostelDashboard,
  releaseAllocation,
  saveHostelWithRooms,
  saveRoom,
} from "../services/hostel.service";
import type { Hostel, HostelFormValues, RoomDraft, RoomFormValues, Room } from "../types/hostel.types";

const initialHostelForm: HostelFormValues = {
  hostel_name: "",
  gender_type: "boys",
  address: "",
  status: "active",
};

const initialRoomDraft: RoomDraft = {
  room_number: "",
  floor: "",
  type: "double",
  capacity: "2",
  monthly_fee: "",
  status: "active",
};

const initialRoomForm: RoomFormValues = {
  hostel_id: "",
  room_number: "",
  floor: "",
  type: "double",
  capacity: "2",
  monthly_fee: "",
  status: "active",
};

export function useHostelData() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [selectedHostelFilter, setSelectedHostelFilter] = useState("");
  const [showHostelForm, setShowHostelForm] = useState(false);
  const [openRoomActionId, setOpenRoomActionId] = useState<number | null>(null);
  const [hostelForm, setHostelForm] = useState<HostelFormValues>(initialHostelForm);
  const [roomDrafts, setRoomDrafts] = useState<RoomDraft[]>([initialRoomDraft]);
  const [editingHostelId, setEditingHostelId] = useState<number | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingRoomForm, setEditingRoomForm] = useState<RoomFormValues>(initialRoomForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPage = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getHostelDashboard();
      setHostels(data.hostels);
      setRooms(data.rooms);
      setAllocations(data.allocations);
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
    setHostelForm(initialHostelForm);
    setRoomDrafts([initialRoomDraft]);
    setShowHostelForm(false);
  };

  const resetRoomForm = () => {
    setEditingRoomId(null);
    setEditingRoomForm(initialRoomForm);
  };

  const handleSaveHostel = async () => {
    setMessage("");
    setError("");
    try {
      const result = await saveHostelWithRooms(editingHostelId, hostelForm, roomDrafts);
      setMessage(editingHostelId ? "Hostel updated." : result.roomCount > 0 ? "Hostel and rooms created." : "Hostel created.");
      resetHostelForm();
      await loadPage();
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || "Failed to save hostel.");
    }
  };

  const handleSaveRoom = async () => {
    setMessage("");
    setError("");
    try {
      await saveRoom(editingRoomId, editingRoomForm);
      setMessage(editingRoomId ? "Room updated." : "Room created.");
      resetRoomForm();
      await loadPage();
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || "Failed to save room.");
    }
  };

  const handleDeleteHostel = async (hostelId: number) => {
    if (!window.confirm("Delete this hostel?")) return;
    try {
      await deleteHostel(hostelId);
      setMessage("Hostel deleted.");
      await loadPage();
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.error || "Failed to delete hostel.");
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!window.confirm("Delete this room?")) return;
    try {
      await deleteRoom(roomId);
      setMessage("Room deleted.");
      await loadPage();
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.error || "Failed to delete room.");
    }
  };

  const handleReleaseAllocation = async (allocationId: number) => {
    if (!window.confirm("Release this hostel seat?")) return;
    try {
      await releaseAllocation(allocationId);
      setMessage("Seat released and marked vacant.");
      await loadPage();
    } catch (releaseError: any) {
      setError(releaseError.response?.data?.error || "Failed to release hostel seat.");
    }
  };

  return {
    hostels,
    rooms,
    allocations,
    selectedHostelFilter,
    setSelectedHostelFilter,
    showHostelForm,
    setShowHostelForm,
    openRoomActionId,
    setOpenRoomActionId,
    hostelForm,
    setHostelForm,
    roomDrafts,
    setRoomDrafts,
    editingHostelId,
    setEditingHostelId,
    editingRoomId,
    setEditingRoomId,
    editingRoomForm,
    setEditingRoomForm,
    loading,
    message,
    error,
    filteredRooms,
    resetHostelForm,
    resetRoomForm,
    handleSaveHostel,
    handleSaveRoom,
    handleDeleteHostel,
    handleDeleteRoom,
    handleReleaseAllocation,
  };
}
