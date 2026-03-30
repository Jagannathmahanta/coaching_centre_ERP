import api from "../../../shared/services/api";
import type { Holiday, HolidayFormValues } from "../types/holiday.types";

export async function getHolidays(): Promise<Holiday[]> {
  const response = await api.get("/holidays");
  return response.data || [];
}

export async function createHoliday(payload: HolidayFormValues): Promise<Holiday> {
  const response = await api.post("/holidays", payload);
  return response.data;
}

export async function deleteHoliday(holidayId: number) {
  const response = await api.delete(`/holidays/${holidayId}`);
  return response.data;
}
