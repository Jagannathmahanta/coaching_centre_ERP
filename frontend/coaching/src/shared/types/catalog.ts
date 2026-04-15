export type CatalogProgramType = "academic" | "non_academic";

export type CatalogClass = {
  id: number;
  class_name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type CatalogCourse = {
  id: number;
  course_name: string;
  description?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type CatalogBatch = {
  id: number;
  program_type: CatalogProgramType;
  board?: string | null;
  class_id?: number | null;
  course_id?: number | null;
  class_name?: string | null;
  course_name?: string | null;
  shift: "morning" | "afternoon" | "evening";
  batch_name: string;
  start_time: string;
  end_time: string;
  capacity?: number | null;
  enrolled_count?: number | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type CatalogBootstrap = {
  classes: CatalogClass[];
  courses: CatalogCourse[];
  batches: CatalogBatch[];
};
