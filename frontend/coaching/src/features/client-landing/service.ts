import api from "../../shared/services/api";
import type { CatalogBatch, CatalogClass, CatalogCourse } from "../../shared/types/catalog";

export type LandingTenant = {
  id: number;
  name: string;
  slug: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  status?: string | null;
  plan?: string | null;
};

export type PublicLandingPayload = {
  tenant: LandingTenant;
  classes: CatalogClass[];
  courses: CatalogCourse[];
  batches: CatalogBatch[];
};

export function detectCenterSlugFromHost(hostname: string) {
  const normalizedHost = hostname.toLowerCase();
  if (
    !normalizedHost ||
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost.endsWith(".localhost")
  ) {
    return "";
  }

  const parts = normalizedHost.split(".");
  if (parts.length < 3 || parts[0] === "www") {
    return "";
  }

  return parts[0];
}

export function resolveLandingSlug(search: string) {
  const params = new URLSearchParams(search);
  const querySlug = params.get("center")?.trim().toLowerCase();
  if (querySlug) {
    return querySlug;
  }

  if (typeof window === "undefined") {
    return "";
  }

  return detectCenterSlugFromHost(window.location.hostname);
}

export async function getPublicLanding(slug: string): Promise<PublicLandingPayload> {
  const response = await api.get(`/catalog/public/${encodeURIComponent(slug)}`);
  return response.data;
}
