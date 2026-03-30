import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteHoliday } from "../services/holiday.service";

export function useDeleteHoliday(onSuccess: () => void, onError: (message: string) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: async () => {
      onSuccess();
      await queryClient.invalidateQueries({ queryKey: ["holidays"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-command-center"] });
    },
    onError: (mutationError: any) => {
      onError(mutationError.response?.data?.error || "Failed to delete holiday.");
    },
  });
}
