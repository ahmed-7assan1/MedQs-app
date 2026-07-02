-- Add extractedText and searchVector for full-text search
ALTER TABLE "Lecture" ADD COLUMN "extractedText" TEXT;
ALTER TABLE "Lecture" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (to_tsvector('arabic', coalesce("extractedText", '') || ' ' || coalesce("title", ''))) STORED;
CREATE INDEX lecture_search_idx ON "Lecture" USING GIN ("searchVector");
