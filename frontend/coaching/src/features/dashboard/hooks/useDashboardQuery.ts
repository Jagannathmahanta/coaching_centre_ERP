import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../services/dashboard.service";

export const useDashboardQuery = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });
};