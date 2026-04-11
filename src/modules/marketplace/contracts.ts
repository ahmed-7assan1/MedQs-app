export type CourseVisibility = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type CourseCreateInput = {
  teacherUserId: string;
  tenantKey: string;
  title: string;
  description: string;
  priceCents: number;
};

export type MarketplaceServiceContract = {
  createCourse: (input: CourseCreateInput) => Promise<{ courseId: string }>;
  enrollStudent: (courseId: string, studentUserId: string) => Promise<{ enrollmentId: string }>;
  publishCourse: (courseId: string, teacherUserId: string) => Promise<{ visibility: CourseVisibility }>;
};
