import { NextRequest, NextResponse } from "next/server";

const OPEN_LIBRARY_BASE = "https://openlibrary.org";

interface CacheEntry {
  data: any;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

const MEDICAL_KEYWORDS = [
  "medicine", "medical", "clinical", "anatomy", "physiology", "pharmacology",
  "pathology", "surgery", "surgical", "cardiology", "pediatrics", "neurology",
  "microbiology", "biochemistry", "internal medicine", "diagnostic", "therapy",
  "therapeutic", "disease", "diseases", "syndrome", "treatment", "patient",
  "health", "healthcare", "nursing", "dentistry", "veterinary", "pharmacy",
  "pharmaceutical", "immunology", "hematology", "oncology", "radiology",
  "orthopedics", "gynecology", "obstetrics", "dermatology", "psychiatry",
  "ophthalmology", "otolaryngology", "urology", "nephrology", "endocrinology",
  "gastroenterology", "pulmonology", "rheumatology", "infectious", "epidemiology",
  "biomedical", "medicinal", "drug", "drugs", "hospital", "anatomical",
  "physiological", "diagnosis", "prognosis", "etiology", "pathophysiology",
  "histology", "embryology", "genetics", "molecular biology", "cell biology",
  "neuroscience", "biostatistics", "toxicology", "virology", "bacteriology",
  "parasitology", "public health", "nutrition", "dietetics", "rehabilitation",
  "physiotherapy", "occupational therapy", "speech therapy", "alternative medicine",
  "nurse", "nurses", "nursing", "doctor", "physician", "surgeon",
  "human anatomy", "human physiology", "medical textbook", "medical reference",
  "medical students", "clinical medicine", "clinical skills", "bedside medicine",
  "emergency medicine", "family medicine", "sports medicine", "preventive medicine",
  "forensic medicine", "tropical medicine", "genomic", "genomics",
  "psychology", "psychiatry", "mental health", "behavioral health",
  "radiologic", "mri", "ct scan", "ultrasound", "echocardiography",
  "blood", "hematologic", "cancer", "tumor", "malignancy", "neoplasm",
  "symptom", "symptoms", "clinical examination", "physical examination",
  "pathophysiology", "medical ethics", "bioethics", "medical education",
  "obstetric", "gynecologic", "pediatric", "pediatric nursing",
  "critical care", "intensive care", "icu", "anesthesia", "anesthesiology",
  "orthopedic", "orthopaedic", "reproductive health", "sexual health",
  "dental", "oral health", "optometry", "vision science",
  "biotechnology", "bioengineering", "medical technology",
  "osteopathy", "chiropractic", "homeopathy", "naturopathy",
  "acupuncture", "herbal medicine", "traditional medicine",
  "psychopharmacology", "neuropsychology", "cognitive science",
  "rehabilitation medicine", "physical therapy", "occupational health",
  "speech pathology", "audiology", "nutrition science", "dietary",
  "clinical psychology", "counseling", "psychotherapy",
  "public health", "global health", "environmental health",
  "health policy", "health administration", "health informatics",
  "medical informatics", "biomedical engineering", "tissue engineering",
  "regenerative medicine", "stem cell", "gene therapy",
  "veterinary medicine", "veterinary science", "zoological medicine",
  "medical research", "clinical research", "translational medicine",
  "health sciences", "life sciences", "basic medical sciences",
  "preclinical", "clinical rotation", "residency", "fellowship",
  "board review", "usmle", "medical licensure", "medical board",
  "anatomy atlas", "anatomy textbook", "surgical atlas",
  "drug guide", "pharmacopoeia", "formulary", "medication",
  "nursing diagnosis", "nursing care", "nursing intervention",
  "midwifery", "paramedic", "emergency medical services",
  "epidemiologic", "biostatistical", "health statistics",
  "medical sociology", "medical anthropology", "medical humanities",
];

const NON_MEDICAL_KEYWORDS = [
  "fiction", "fantasy", "novel", "mystery", "thriller", "romance", "horror",
  "science fiction", "cooking", "cookbook", "recipe", "history",
  "mathematics", "physics", "chemistry", "astronomy", "geology",
  "engineering", "computer science", "programming", "software",
  "art", "music", "painting", "sculpture", "photography",
  "poetry", "drama", "literature", "biography", "autobiography",
  "travel", "sports", "recreation", "gardening", "crafts",
  "business", "economics", "finance", "marketing", "management",
  "law", "legal", "philosophy", "religion", "theology",
  "education", "teaching", "pedagogy", "language", "linguistics",
  "cooking", "food", "wine", "fashion", "architecture",
  "self-help", "personal development", "motivation",
];

const NON_MEDICAL_SUBJECT_PREFIXES = [
  "juvenile fiction", "juvenile literature", "children's stories",
  "young adult", "comic", "graphic novel", "picture book",
];

function isMedicalBook(book: any, sourceIsMedicalSubject: boolean): boolean {
  const subjects = book.subject || [];
  const lowerSubjects = subjects.map((s: string) => s.toLowerCase());

  const title = (book.title || "").toLowerCase();
  const authorNames = (book.author_name || []).map((a: string) => a.toLowerCase());
  const combinedText = [...lowerSubjects, title, ...authorNames].join(" ");

  const hasNonMedical = NON_MEDICAL_KEYWORDS.some((kw) => {
    const inSubject = lowerSubjects.some((s: string) => s.includes(kw));
    const inTitle = title.includes(kw);
    const inCombined = combinedText.includes(kw);
    if (!inSubject && !inTitle) return false;
    if (inTitle && MEDICAL_KEYWORDS.some((mk) => title.includes(mk))) return false;
    return inSubject || (inTitle && !MEDICAL_KEYWORDS.some((mk) => title.includes(mk)));
  });

  if (hasNonMedical) return false;

  const hasNonMedicalPrefix = NON_MEDICAL_SUBJECT_PREFIXES.some((prefix) =>
    lowerSubjects.some((s: string) => s.startsWith(prefix))
  );
  if (hasNonMedicalPrefix) return false;

  if (subjects.length === 0) {
    return sourceIsMedicalSubject;
  }

  const hasMedical = lowerSubjects.some((s: string) =>
    MEDICAL_KEYWORDS.some((kw) => s.includes(kw))
  );
  if (hasMedical) return true;

  const titleHasMedical = MEDICAL_KEYWORDS.some((kw) => title.includes(kw));
  return titleHasMedical && sourceIsMedicalSubject;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const subject = req.nextUrl.searchParams.get("subject") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20", 10), 50);
  const offset = (page - 1) * limit;

  const sourceIsMedicalSubject = !!(subject || q.toLowerCase().includes("medic"));

  let url: string;
  let isSubjectEndpoint = false;

  if (subject && !q) {
    const subPath = subject.toLowerCase().replace(/\s+/g, "_");
    url = `${OPEN_LIBRARY_BASE}/subjects/${subPath}.json?limit=${limit * 2}&offset=${offset}`;
    isSubjectEndpoint = true;
  } else {
    const params = new URLSearchParams();
    const searchTerm = q ? (q.toLowerCase().includes("medic") ? q : `medicine ${q}`) : "";
    if (searchTerm) params.set("q", searchTerm);
    params.set("subject", "medicine");
    if (subject && subject !== "medicine") {
      params.set("subject", subject);
    }
    params.set("limit", (limit * 2).toString());
    params.set("offset", offset.toString());
    params.set(
      "fields",
      "key,title,author_name,cover_i,first_publish_year,subject,edition_count,has_fulltext,ebook_access,ia,id_goodreads,id_amazon,first_sentence"
    );
    url = `${OPEN_LIBRARY_BASE}/search.json?${params.toString()}`;
  }

  const cacheKey = url;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Open Library request failed", docs: [], total: 0 }, { status: 502 });
    }

    const data = await res.json();

    const rawDocs = isSubjectEndpoint
      ? (data.works || []).map(normalizeSubjectWork)
      : (data.docs || []).map(normalizeSearchDoc);

    const docs = rawDocs.filter((doc: any) => isMedicalBook(doc, sourceIsMedicalSubject || isSubjectEndpoint));

    const result = {
      docs: docs.slice(0, limit),
      total: docs.length,
      page,
      limit,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Open Library timed out", docs: [], total: 0 }, { status: 504 });
    }
    return NextResponse.json({ error: err.message, docs: [], total: 0 }, { status: 500 });
  }
}

function normalizeSearchDoc(doc: any) {
  return {
    key: doc.key,
    title: doc.title,
    author_name: doc.author_name || [],
    cover_i: doc.cover_i || null,
    first_publish_year: doc.first_publish_year || null,
    subject: doc.subject || [],
    edition_count: doc.edition_count || 0,
    has_fulltext: !!doc.has_fulltext,
    ebook_access: doc.ebook_access || "no_ebook",
    ia: Array.isArray(doc.ia) ? doc.ia : doc.ia ? [doc.ia] : [],
    id_goodreads: doc.id_goodreads || null,
    id_amazon: doc.id_amazon || null,
  };
}

function normalizeSubjectWork(work: any) {
  return {
    key: work.key,
    title: work.title,
    author_name: work.authors?.map((a: any) => a.name) || [],
    cover_i: work.cover_id || work.cover_i || null,
    first_publish_year: work.first_publish_year || null,
    subject: work.subject || [],
    edition_count: work.edition_count || 0,
    has_fulltext: false,
    ebook_access: "no_ebook",
    ia: null,
  };
}
