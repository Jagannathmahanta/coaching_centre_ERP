// features/students/hooks/useDeleteStudent.ts

import { useMutation } from "@tanstack/react-query";
import api from "../../../shared/services/api";

export const useDeleteStudent = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/students/${id}`);
    },
  });
};