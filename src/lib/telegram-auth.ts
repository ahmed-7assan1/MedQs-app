import { prisma } from "./prisma";

/**
 * Generates an abbreviation from a university name.
 * Mansoura National University -> MNU
 */
export function generateAbbr(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 3).toLowerCase();
  
  return words
    .map(w => w[0])
    .join("")
    .toLowerCase();
}

/**
 * Ensures the abbreviation is unique in the database.
 * If MNU exists, returns MNU2, etc.
 */
export async function getUniqueUniAbbr(name: string): Promise<string> {
  const base = generateAbbr(name);
  let abbr = base;
  let counter = 1;

  while (true) {
    const exists = await prisma.university.findFirst({
      where: { abbr },
      select: { id: true }
    });

    if (!exists) return abbr;
    counter++;
    abbr = `${base}${counter}`;
  }
}

/**
 * Generates a 6-digit random verification code.
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Maps faculty category to its ID prefix character.
 */
export function getFacultyPrefix(category: string): string {
  switch (category) {
    case "HUMAN_MEDICINE":   return "m";
    case "DENTAL_MEDICINE":  return "d";
    case "PHARMACY":         return "p";
    case "PHYSICAL_THERAPY": return "pt";
    default:                 return "o";
  }
}
