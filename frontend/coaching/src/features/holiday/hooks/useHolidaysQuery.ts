import { useQuery } from "@tanstack/react-query";
import { getHolidays } from "../services/holiday.service";

export function useHolidaysQuery() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: getHolidays,
  });
}
