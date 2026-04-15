export type ClassFormState = {
  id?: number;
  class_name: string;
  status: string;
};

export type CourseFormState = {
  id?: number;
  course_name: string;
  description: string;
  status: string;
};

export type BatchFormState = {
  id?: number;
  program_type: "academic" | "non_academic";
  board: string;
  class_id: string;
  course_id: string;
  shift: "morning" | "afternoon" | "evening";
  batch_name: string;
  start_time: string;
  end_time: string;
  capacity: string;
  status: string;
};

export const initialClassForm: ClassFormState = {
  class_name: "",
  status: "active",
};

export const initialCourseForm: CourseFormState = {
  course_name: "",
  description: "",
  status: "active",
};

export const initialBatchForm: BatchFormState = {
  program_type: "academic",
  board: "CBSE",
  class_id: "",
  course_id: "",
  shift: "morning",
  batch_name: "",
  start_time: "07:00",
  end_time: "08:00",
  capacity: "",
  status: "active",
};
