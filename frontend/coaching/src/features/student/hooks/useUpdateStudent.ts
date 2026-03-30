// features/students/hooks/useUpdateStudent.ts

import { useMutation } from "@tanstack/react-query";
import api from "../../../shared/services/api";


export const useUpdateStudent = () => {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.patch(`/students/${id}`, payload);
      return res.data;
    },
  });
};
