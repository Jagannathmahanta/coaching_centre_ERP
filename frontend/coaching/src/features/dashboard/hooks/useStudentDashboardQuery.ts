import { useQuery } from "@tanstack/react-query";
import { getStudentDashboard } from "../services/dashboard.service";

export const useStudentDashboardQuery = () => {
  return useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
  });
};
