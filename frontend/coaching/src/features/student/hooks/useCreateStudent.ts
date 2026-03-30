// features/students/hooks/useCreateStudent.ts

import { useMutation } from "@tanstack/react-query";
import api from "../../../shared/services/api";


export const useCreateStudent = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/students", payload);
      return res.data;
    },
  });
};