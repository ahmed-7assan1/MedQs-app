-- Remove full-text search columns and index (lectures use notesMarkdown instead)
DROP INDEX IF EXISTS "lecture_search_idx";
ALTER TABLE "Lecture" DROP COLUMN IF EXISTS "searchVector";
ALTER TABLE "Lecture" DROP COLUMN IF EXISTS "extractedText";
