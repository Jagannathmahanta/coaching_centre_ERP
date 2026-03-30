
import { downloadResultData } from "../services/dashboard.service";

export const useDownloadResult = () => {
  const download = async (examId: number) => {
    const { exam, roster, results } = await downloadResultData(examId);

    const resultMap = new Map(
      results.map((item: any) => [String(item.student_id), item])
    );

    const lines = [
      ["Exam Name", exam?.exam_name || ""],
      ["Subject", exam?.subject || ""],
      ["Class", exam?.class || ""],
      ["Date", exam?.exam_date || ""],
      [],
      ["Admission No", "Student", "Status", "Marks", "Grade", "Rank"],
      ...roster.map((student: any) => {
        const result = resultMap.get(String(student.student_id)) || student;
        return [
          student.roll_number || "",
          student.student_name || "",
          result.status || "present",
          result.marks_obtained ?? "",
          result.grade || "",
          result.rank ?? "",
        ];
      }),
    ];

    const csv = lines
      .map((row) =>
        row.map((cell: string | number) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${exam?.exam_name || "result"}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return { download };
};
