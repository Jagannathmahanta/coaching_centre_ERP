import { useQuery } from "@tanstack/react-query";
import { getPlatformCenters } from "../services/dashboard.service";

export const usePlatformCentersQuery = () => {
  return useQuery({
    queryKey: ["platform-centers"],
    queryFn: getPlatformCenters,
  });
};
