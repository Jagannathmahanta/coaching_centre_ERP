// features/students/hooks/useCreateStudentLogin.ts

import { useMutation } from "@tanstack/react-query";
import api from "../../../shared/services/api";


type Payload = {
  role: "student";
  student_id: number;
  email?: string;
  phone?: string;
  password: string;
};

export const useCreateStudentLogin = () => {
  return useMutation({
    mutationFn: async (payload: Payload) => {
      const res = await api.post("/auth/accounts", payload);
      return res.data;
    },
  });
};