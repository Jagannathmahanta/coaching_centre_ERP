export type Hostel = {
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

export type Room = {
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

export type Allocation = {
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

export type HostelFormValues = {
  hostel_name: string;
  gender_type: "boys" | "girls";
  address: string;
  status: string;
};

export type RoomDraft = {
  room_number: string;
  floor: string;
  type: string;
  capacity: string;
  monthly_fee: string;
  status: string;
};

export type RoomFormValues = {
  hostel_id: string;
  room_number: string;
  floor: string;
  type: string;
  capacity: string;
  monthly_fee: string;
  status: string;
};
