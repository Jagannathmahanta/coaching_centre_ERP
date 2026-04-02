import api from "../../../shared/services/api";
import type { CatalogBatch, CatalogClass, CatalogCourse } from "../../../shared/types/catalog";

export type CatalogAdminBootstrap = {
  classes: CatalogClass[];
  courses: CatalogCourse[];
  batches: CatalogBatch[];
};

export async function getCatalogBootstrap(): Promise<CatalogAdminBootstrap> {
  const response = await api.get("/catalog/bootstrap");
  return response.data || { classes: [], courses: [], batches: [] };
}

export async function saveClass(payload: { id?: number; class_name: string; status: string }) {
  if (payload.id) {
    const response = await api.patch(`/catalog/classes/${payload.id}`, payload);
    return response.data;
  }

  const response = await api.post("/catalog/classes", payload);
  return response.data;
}

export async function saveCourse(payload: { id?: number; course_name: string; description?: string; status: string }) {
  if (payload.id) {
    const response = await api.patch(`/catalog/courses/${payload.id}`, payload);
    return response.data;
  }

  const response = await api.post("/catalog/courses", payload);
  return response.data;
}

export async function saveBatch(payload: {
  id?: number;
  program_type: "academic" | "non_academic";
  board?: string;
  class_id?: number;
  course_id?: number;
  shift: "morning" | "afternoon" | "evening";
  batch_name: string;
  start_time: string;
  end_time: string;
  capacity?: number;
  status: string;
}) {
  if (payload.id) {
    const response = await api.patch(`/catalog/batches/${payload.id}`, payload);
    return response.data;
  }

  const response = await api.post("/catalog/batches", payload);
  return response.data;
}
