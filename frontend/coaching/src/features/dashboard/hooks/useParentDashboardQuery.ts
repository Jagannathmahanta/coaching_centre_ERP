import { useQuery } from "@tanstack/react-query";
import { getParentDashboard } from "../services/dashboard.service";

export const useParentDashboardQuery = () => {
  return useQuery({
    queryKey: ["parent-dashboard"],
    queryFn: getParentDashboard,
  });
};
