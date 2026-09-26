/**
 * Certificates (Sprint 58 §19).
 *
 * A certificate is earned, never seeded. The service reads /api/certificates,
 * which derives one certificate per fully-completed course from persisted lesson
 * progress.
 */
import { apiFetchSafe } from "./api";

export interface CertificateRecord {
  id: string;
  title: string;
  description: string;
  earnedAt: string;
  episodeId: string;
  gradient: string;
}

export interface CourseProgressSummary {
  courseId: string;
  title: string;
  completed: number;
  total: number;
  percent: number;
  gradient: string;
}

export async function fetchCertificates(): Promise<{
  data: CertificateRecord[] | null;
  inProgress: CourseProgressSummary[];
  totalCourses: number;
  error: string | null;
}> {
  const result = await apiFetchSafe<{
    certificates: CertificateRecord[];
    inProgress: CourseProgressSummary[];
    totalCourses: number;
  }>("/api/certificates");
  return {
    data: result.data?.certificates ?? null,
    inProgress: result.data?.inProgress ?? [],
    totalCourses: result.data?.totalCourses ?? 0,
    error: result.error,
  };
}
