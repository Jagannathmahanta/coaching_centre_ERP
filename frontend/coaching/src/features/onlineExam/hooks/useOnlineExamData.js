import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../shared/hooks/AuthContext";
import {
  createOnlineExam,
  deleteOnlineExam,
  getMyOnlineExamSubmission,
  getOnlineExam,
  getOnlineExamClassOptions,
  getOnlineExams,
  getOnlineExamSubmissions,
  gradeOnlineExamSubmission,
  saveOnlineExamQuestions,
  submitOnlineExam,
  updateOnlineExam,
} from "../services/onlineExam.service";

export function useOnlineExamData() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const role = profile?.role || "";

  const examsQuery = useQuery({
    queryKey: ["online-exams", role],
    queryFn: getOnlineExams,
  });

  const classOptionsQuery = useQuery({
    queryKey: ["online-exam-class-options"],
    queryFn: getOnlineExamClassOptions,
  });

  const invalidateOnlineExamData = async (examId) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["online-exams"] }),
      examId ? queryClient.invalidateQueries({ queryKey: ["online-exam", examId] }) : Promise.resolve(),
      examId ? queryClient.invalidateQueries({ queryKey: ["online-exam-submissions", examId] }) : Promise.resolve(),
      examId ? queryClient.invalidateQueries({ queryKey: ["online-exam-my-submission", examId] }) : Promise.resolve(),
    ]);
  };

  const saveExamMutation = useMutation({
    mutationFn: async (exam) => {
      const savedExam = exam.id ? await updateOnlineExam(exam.id, exam) : await createOnlineExam(exam);
      await saveOnlineExamQuestions(savedExam.id, exam.questions || []);
      return getOnlineExam(savedExam.id);
    },
    onSuccess: async (savedExam) => {
      await invalidateOnlineExamData(savedExam.id);
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: deleteOnlineExam,
    onSuccess: async () => {
      await invalidateOnlineExamData();
    },
  });

  const submitExamMutation = useMutation({
    mutationFn: ({ examId, payload }) => submitOnlineExam(examId, payload),
    onSuccess: async (result, variables) => {
      await invalidateOnlineExamData(variables.examId);
    },
  });

  const gradeSubmissionMutation = useMutation({
    mutationFn: ({ submissionId, payload }) => gradeOnlineExamSubmission(submissionId, payload),
    onSuccess: async (submission) => {
      await invalidateOnlineExamData(submission.examId);
    },
  });

  const fetchExam = async (examId) => {
    return queryClient.fetchQuery({
      queryKey: ["online-exam", examId],
      queryFn: () => getOnlineExam(examId),
    });
  };

  const fetchSubmissions = async (examId) => {
    return queryClient.fetchQuery({
      queryKey: ["online-exam-submissions", examId],
      queryFn: () => getOnlineExamSubmissions(examId),
    });
  };

  const fetchMySubmission = async (examId) => {
    return queryClient.fetchQuery({
      queryKey: ["online-exam-my-submission", examId],
      queryFn: () => getMyOnlineExamSubmission(examId),
    });
  };

  return {
    role,
    exams: examsQuery.data || [],
    classOptions: classOptionsQuery.data || [],
    examsQuery,
    classOptionsQuery,
    saveExamMutation,
    deleteExamMutation,
    submitExamMutation,
    gradeSubmissionMutation,
    fetchExam,
    fetchSubmissions,
    fetchMySubmission,
  };
}
