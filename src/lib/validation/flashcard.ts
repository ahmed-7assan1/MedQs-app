import { z } from "zod";

export const createFlashcardSchema = z.object({
  front: z.string().min(1).max(500).trim(),
  back: z.string().min(1).max(1000).trim(),
});

export const updateFlashcardSchema = z.object({
  front: z.string().min(1).max(500).trim(),
  back: z.string().min(1).max(1000).trim(),
});

export const srsRatingSchema = z.object({
  rating: z.number().int().min(0).max(5),
});

export const flashcardSetSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  source: z.string().optional(),
  cards: z.array(
    z.object({
      front: z.string().min(1).max(500),
      back: z.string().min(1).max(1000),
    })
  ).min(1, "Flashcard set must have at least one card"),
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type FlashcardSetInput = z.infer<typeof flashcardSetSchema>;
