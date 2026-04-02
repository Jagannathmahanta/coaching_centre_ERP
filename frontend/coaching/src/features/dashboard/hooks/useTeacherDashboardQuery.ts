import { useQuery } from "@tanstack/react-query";
import { getTeacherDashboard } from "../services/dashboard.service";

export const useTeacherDashboardQuery = () => {
  return useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: getTeacherDashboard,
  });
};
