/**
 * Product copy: in this platform, faculty content owners are addressed as “Doctor”
 * (Arabic academic convention: الدكتور / أعضاء هيئة التدريس).
 * Routes remain `/admin/*` for stability; user-facing strings use doctor/faculty wording.
 */
export const PLATFORM_COPY = {
  doctorHub: "Doctor hub",
  doctorHubNav: "Doctor hub",
  doctorPanel: "Doctor hub",
  teachingWorkspace: "Teaching workspace",
  studentView: "Student view",
  doctorShortcutsMenu: "Doctor hub shortcuts",
  doctorShortcutsSubtitle: "While previewing as a student",
  floatingDoctorButton: "Doctor hub",
  loginDoctorHint:
    "Doctors & faculty: sign in with your university account, then open the Doctor hub to publish lectures, papers, and forums.",
  landingForDoctorsEyebrow: "For doctors & faculty",
  landingForDoctorsTitle: "Publish once. Students learn everywhere.",
  landingForDoctorsBody:
    "Structure your curriculum, upload lectures and past papers, moderate forums, and use AI tools to generate questions — all in one Doctor hub.",
  landingForDoctorsCta: "Open Doctor hub",
  landingForDoctorsArabic: "لوحة الدكتور — محتوى المحاضرات، الأسئلة، والمنتدى في مكان واحد.",
} as const;
