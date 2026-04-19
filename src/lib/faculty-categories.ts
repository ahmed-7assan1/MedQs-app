export type FacultyCategory = 
  | "HUMAN_MEDICINE" 
  | "DENTAL_MEDICINE" 
  | "PHARMACY" 
  | "PHYSICAL_THERAPY" 
  | "OTHER";

export const FACULTY_CATEGORY_LABELS: Record<FacultyCategory, { ar: string; en: string }> = {
  HUMAN_MEDICINE: { ar: "الطب البشري", en: "Human Medicine" },
  DENTAL_MEDICINE: { ar: "طب الأسنان", en: "Dental Medicine" },
  PHARMACY: { ar: "الصيدلة", en: "Pharmacy" },
  PHYSICAL_THERAPY: { ar: "العلاج الطبيعي", en: "Physical Therapy" },
  OTHER: { ar: "أخرى", en: "Other" },
};

export function getFacultyCategoryLabel(category: FacultyCategory, locale: "ar" | "en" = "ar") {
  return FACULTY_CATEGORY_LABELS[category][locale];
}

/**
 * Maps common faculty names to their categories for auto-initialization.
 */
export function mapFacultyNameToCategory(name: string): FacultyCategory {
  const n = name.toLowerCase();
  if (n.includes("بشري") || n.includes("human") || n.includes("medicine")) return "HUMAN_MEDICINE";
  if (n.includes("أسنان") || n.includes("dental") || n.includes("dentistry")) return "DENTAL_MEDICINE";
  if (n.includes("صيدلة") || n.includes("pharmacy")) return "PHARMACY";
  if (n.includes("علاج") || n.includes("therapy") || n.includes("physio")) return "PHYSICAL_THERAPY";
  return "OTHER";
}
