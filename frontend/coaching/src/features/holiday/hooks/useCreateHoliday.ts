import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHoliday } from "../services/holiday.service";

export function useCreateHoliday(onSuccess: () => void, onError: (message: string) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHoliday,
    onSuccess: async () => {
      onSuccess();
      await queryClient.invalidateQueries({ queryKey: ["holidays"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-command-center"] });
    },
    onError: (mutationError: any) => {
      onError(mutationError.response?.data?.error || "Failed to create holiday.");
    },
  });
}
