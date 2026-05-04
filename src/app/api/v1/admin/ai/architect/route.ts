import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/tenant";
import { generateJsonWithFallback } from "@/lib/ai-router";

function semanticMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const tA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!tA || !tB) return false;
  if (tA === tB) return true;
  if (tA.includes(tB) && tA.length - tB.length < 8) return true;
  if (tB.includes(tA) && tB.length - tA.length < 8) return true;
  return false;
}

function compactText(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  const seen = new Set<string>();
  const clean: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Skip common boilerplate
    if (/^Page \d+$/i.test(line)) continue;
    if (/^\d+$/i.test(line)) continue; // skip solitary page numbers
    if (line.toLowerCase().includes("student guide") && line.length < 30) continue;
    
    // Basic deduplication for headers/footers appearing on every page
    if (seen.has(line) && line.length > 50) continue; 
    seen.add(line);
    
    clean.push(line);
  }

  return clean.join("\n").slice(0, 450000); // safety cap
}

export const runtime = "nodejs";
export const maxDuration = 300;

async function fileToText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = (file.name || "").toLowerCase();
  
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    // Dynamic import to avoid edge runtime issues. Hidden from webpack to prevent transpile errors.
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data }).promise;

    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const annotations = await page.getAnnotations();
      
      const links = annotations.filter((a: any) => a.subtype === 'Link' && a.url);

      let lastY = -1;
      let textLine = '';

      for (const item of content.items) {
        if (!("str" in item)) continue; // skip marks
        const transform = item.transform;
        const x = transform[4];
        const y = transform[5]; 

        let matchedLink = null;
        for (const link of links) {
          if (!link.rect) continue;
          const [x1, y1, x2, y2] = link.rect;
          // leeway in coordinates
          if (x >= x1 - 5 && x <= x2 + 5 && y >= y1 - 5 && y <= y2 + 5) {
             matchedLink = link.url;
             break;
          }
        }

        let textStr = item.str;
        if (matchedLink) textStr = `[${textStr}](${matchedLink})`;

        if (lastY !== -1 && Math.abs(y - lastY) > 5) {
           fullText += textLine + '\n';
           textLine = textStr;
        } else {
           textLine += textStr; // appending tightly, AI handles spaces
        }
        lastY = y;
      }
      fullText += textLine + '\n\n';
    }
    return fullText;
  }
  
  return buffer.toString("utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const form = await req.formData() as any;
    const mode = String(form.get("mode") || "analyze"); // analyze | commit
    const scope = String(form.get("scope") || "semester"); // semester | module
    const semesterId = String(form.get("semesterId") || "");
    const wipesExisting = String(form.get("wipe") || "0") === "1";

    if (!semesterId) return NextResponse.json({ error: "semesterId required" }, { status: 400 });

    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      select: { id: true, name: true, academicYear: { select: { yearNumber: true, faculty: { select: { name: true } } } } }
    });
    if (!semester) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

    // --- MODE 1: ANALYZE ---
    if (mode === "analyze") {
      const file = form.get("file") as File | null;
      const rawText = String(form.get("text") || "").trim();
      const personalKey = String(form.get("apiKey") || "");
      const personalProvider = String(form.get("provider") || "gemini");
      let text = rawText;

      if (file) {
        text = await fileToText(file);
      }

      if (!text) return NextResponse.json({ error: "No text found in input" }, { status: 422 });
      
      const cap = compactText(text);
      
      const scopeInstructions = scope === "module" 
        ? "IMPORTANT: The user uploaded a guide for a SINGLE MODULE. DO NOT invent multiple modules. Return exactly ONE module in the modules array, and group all subjects and lectures within it."
        : "Extract the complete semester structure, which usually contains MULTIPLE modules.";

      const systemPrompt = `You are a professional medical curriculum architect. 
Your goal is to parse a university student guide and extract a strictly nested JSON structure.

${scopeInstructions}

Hierarchy Rules:
1. MODULES: High-level system blocks (e.g., "CNS", "Endocrine", "Research").
2. SUBJECTS: Academic departments teaching within that module (e.g., "Anatomy", "Physiology", "Pathology").
3. LECTURES: The specific topic titles.

Return ONLY valid JSON matching this schema:
{
  "modules": [
    {
      "name": "string",
      "subjects": [
        {
          "name": "string",
          "lectures": [
            {
               "title": "string",
               "videoUrls": ["string"],
               "fileUrls": ["string"],
               "recordUrls": ["string"]
            }
          ]
        }
      ]
    }
  ]
}

- Be extremely thorough and accurate. 
- CRITICAL: Extract ALL subjects and ALL lectures. Do not skip, omit, summarize, or group large subjects together. Accuracy and complete exhaustion of the material are required!
- If a section contains many subjects, list them clearly.
- We have encoded hyperlinked text into MarkDown (e.g. [VIDEOS](https://...), [RECORD](https://...), [POWERPOINT](https://...)).
- For \`videoUrls\`, \`fileUrls\`, and \`recordUrls\`: If a lecture has multiple links, extract ALL of them!
- How to categorize: 
  1. If the markdown link text says "[RECORD]" or "[AUDIO]" OR the URL is spotify.com/soundcloud, MUST put it strictly in \`recordUrls\`.
  2. If the markdown link text implies a video (e.g., "[VIDEOS]", "[Video]") OR the URL is YouTube/Vimeo/mp4, MUST put it in \`videoUrls\`.
  3. Put documents, powerpoints, handouts, MCQs, or generic portal links into \`fileUrls\`.
- Use empty arrays [] if none.`;

      const prompt = `Extract the semester structure for ${semester.name} (Year ${semester.academicYear.yearNumber}) - Faculty: ${semester.academicYear.faculty?.name || "Medicine"}.
      
GUIDE TEXT:
${cap}`;

      const fallback = { modules: [] };
      const row = await generateJsonWithFallback<typeof fallback>(prompt, fallback, {
        systemPrompt,
        preferredProvider: personalProvider,
        personalKey: personalKey || undefined,
      });

      return NextResponse.json({ ok: true, structure: row.data });
    }

    // --- MODE 2: COMMIT ---
    if (mode === "commit") {
      const rawStructure = String(form.get("structure") || "");
      if (!rawStructure) return NextResponse.json({ error: "Structure JSON required" }, { status: 400 });
      
      const structure = JSON.parse(rawStructure);
      if (!Array.isArray(structure.modules)) return NextResponse.json({ error: "Invalid structure format" }, { status: 400 });

      // Pre-fetch YouTube titles and scrape generic web links
      for (const mData of structure.modules) {
         for (const sData of mData.subjects || []) {
            if (Array.isArray(sData.lectures)) {
               for (const lec of sData.lectures) {
                  if (typeof lec === 'object') {
                     lec.extractedVideos = [];
                     
                     // Ensure arrays exist
                     if (!Array.isArray(lec.videoUrls)) lec.videoUrls = [];
                     if (!Array.isArray(lec.fileUrls)) lec.fileUrls = [];
                     if (!Array.isArray(lec.recordUrls)) lec.recordUrls = [];
                     
                     // Migrate legacy formats if present
                     if (lec.videoUrl && !lec.videoUrls.includes(lec.videoUrl)) lec.videoUrls.push(lec.videoUrl);
                     if (lec.fileUrl && !lec.fileUrls.includes(lec.fileUrl)) lec.fileUrls.push(lec.fileUrl);

                     const finalFileUrls: string[] = [];
                     const finalRecordUrls: string[] = [];

                     // 0. Process Record URLs
                     for (const url of lec.recordUrls) {
                        if (typeof url !== 'string' || !url) continue;
                        finalRecordUrls.push(url);
                     }
                     lec.recordUrls = finalRecordUrls;

                     // 1. Process Video URLs
                     for (const url of lec.videoUrls) {
                        if (typeof url !== 'string' || !url) continue;
                        if (url.includes('youtube.com') || url.includes('youtu.be') || url.endsWith('.mp4')) {
                           lec.extractedVideos.push({ url, title: "Lecture Video" });
                        } else {
                           // Attempt to scrape
                           let extractedAny = false;
                           try {
                              const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Mozilla/5.0' } });
                              if (res.ok) {
                                  const text = await res.text();
                                  const ytLinks = new Set<string>();
                                  const embedRegex = /(https?:\/\/(?:www\.)?youtube\.com\/(?:embed\/|watch\?v=)[^"'\s<>]+)/g;
                                  let match;
                                  while ((match = embedRegex.exec(text)) !== null) {
                                     ytLinks.add(match[1]);
                                  }
                                  for (const link of ytLinks) {
                                     lec.extractedVideos.push({ url: link, title: "Lecture Video" });
                                     extractedAny = true;
                                  }
                              }
                           } catch(e) {}
                           
                           // If scraping failed, KEEP IT as a video because the AI classified it as one
                           if (!extractedAny) {
                              lec.extractedVideos.push({ url, title: "External Video" });
                           }
                        }
                     }

                     // 2. Process File URLs
                     for (const url of lec.fileUrls) {
                        if (typeof url !== 'string' || !url) continue;
                        let extractedAny = false;
                        if (!url.endsWith('.pdf')) {
                           try {
                              const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Mozilla/5.0' } });
                              if (res.ok) {
                                  const text = await res.text();
                                  const ytLinks = new Set<string>();
                                  const embedRegex = /(https?:\/\/(?:www\.)?youtube\.com\/(?:embed\/|watch\?v=)[^"'\s<>]+)/g;
                                  let match;
                                  while ((match = embedRegex.exec(text)) !== null) {
                                     ytLinks.add(match[1]);
                                  }
                                  for (const link of ytLinks) {
                                     lec.extractedVideos.push({ url: link, title: "Lecture Video" });
                                     extractedAny = true;
                                  }
                              }
                           } catch(e) {}
                        }
                        
                        // If we didn't extract any videos, it remains a file
                        if (!extractedAny) {
                           finalFileUrls.push(url);
                        }
                     }
                     
                     // Update fileUrls to strictly what wasn't converted to videos
                     lec.fileUrls = finalFileUrls;
                     
                     // 3. Fetch YouTube Titles
                     for (const v of lec.extractedVideos) {
                        try {
                           if (v.url.includes('youtube.com') || v.url.includes('youtu.be')) {
                              const res = await fetch(`https://www.youtube.com/oembed?url=${v.url}&format=json`, { signal: AbortSignal.timeout(3000) });
                              if (res.ok) {
                                 const d = await res.json();
                                 if (d.title) v.title = d.title;
                              }
                           }
                        } catch(e) {}
                     }
                  }
               }
            }
         }
      }

      let agentTasks: any[] = [];

      await prisma.$transaction(async (tx: any) => {
        if (wipesExisting) {
          // Careful: This deletes modules, subjects, and lectures (cascade)
          await tx.module.deleteMany({ where: { semesterId } });
        }

        const existingModules = await tx.module.findMany({ 
           where: { semesterId },
           include: { subjects: { include: { lectures: true } } }
        });

        for (const mData of structure.modules) {
          const mName = String(mData.name).trim();
          let module = !wipesExisting ? existingModules.find((em: any) => semanticMatch(em.name, mName)) : null;

          if (!module) {
            module = await tx.module.create({
              data: { name: mName, semesterId }
            });
            existingModules.push({ ...module, subjects: [] });
          }

          for (const sData of mData.subjects || []) {
            const sName = String(sData.name).trim();
            let subject = !wipesExisting ? module.subjects?.find((es: any) => semanticMatch(es.name, sName)) : null;

            if (!subject) {
               subject = await tx.subject.create({
                 data: { name: sName, moduleId: module.id }
               });
               if (!module.subjects) module.subjects = [];
               module.subjects.push({ ...subject, lectures: [] });
            }

            if (Array.isArray(sData.lectures) && sData.lectures.length > 0) {
              // Calculate next order
              let nextOrder = subject.lectures?.length || 0;

              for (let i = 0; i < sData.lectures.length; i++) {
                const lecData = sData.lectures[i];
                const title = typeof lecData === 'string' ? lecData : lecData.title;
                if (!title) continue;
                
                const lName = String(title).trim();
                let lecture = !wipesExisting ? subject.lectures?.find((el: any) => semanticMatch(el.title, lName)) : null;

                if (!lecture) {
                   lecture = await tx.lecture.create({
                     data: { title: lName, subjectId: subject.id, order: nextOrder++ }
                   });
                   if (!subject.lectures) subject.lectures = [];
                   subject.lectures.push(lecture);
                } else {
                   // Optional: If lecture already exists, we might want to skip creating duplicate videos/files
                   // For now, we just attach new resources to the existing lecture unless we check for dupes below
                }

                if (typeof lecData === 'object') {
                  // Handle extracted videos
                  const videosToCreate = Array.isArray(lecData.extractedVideos) ? lecData.extractedVideos : [];
                  for (const v of videosToCreate) {
                     const exists = await tx.lectureVideo.findFirst({ where: { lectureId: lecture.id, url: v.url } });
                     if (!exists) {
                       const newVideo = await tx.lectureVideo.create({
                          data: {
                             lectureId: lecture.id,
                             title: v.title,
                             url: v.url,
                             sourceType: "external"
                          }
                       });

                       // 🟢 NEW: Create a Colab Job for this video automatically
                       await tx.youtubeUploadTask.create({
                          data: {
                             sourceUrl: v.url,
                             title: lecture.title, // Use lecture name as requested
                             lectureVideoId: newVideo.id,
                             status: "PENDING"
                          }
                       });
                     }
                  }

                  // Handle remaining fileUrls array
                  if (Array.isArray(lecData.fileUrls)) {
                     const addedFiles = new Set<string>();
                     for (const fUrl of lecData.fileUrls) {
                        if (typeof fUrl === 'string' && fUrl && !addedFiles.has(fUrl)) {
                           addedFiles.add(fUrl);
                           const exists = await tx.lectureFile.findFirst({ where: { lectureId: lecture.id, url: fUrl } });
                           if (!exists) {
                             await tx.lectureFile.create({
                                data: {
                                  lectureId: lecture.id,
                                  name: "Lecture Material",
                                  url: fUrl,
                                  mimeType: "application/pdf"
                                }
                             });
                             agentTasks.push({ lectureId: lecture.id, lectureTitle: lecture.title, url: fUrl });
                           }
                        }
                     }
                  }

                  // Handle recordUrls array
                  if (Array.isArray(lecData.recordUrls)) {
                     const addedRecords = new Set<string>();
                     for (const rUrl of lecData.recordUrls) {
                        if (typeof rUrl === 'string' && rUrl && !addedRecords.has(rUrl)) {
                           addedRecords.add(rUrl);
                           const exists = await (tx as any).lectureRecord?.findFirst({ where: { lectureId: lecture.id, url: rUrl } }).catch(() => null);
                           if (!exists && (tx as any).lectureRecord) {
                             await (tx as any).lectureRecord.create({
                                data: {
                                  lectureId: lecture.id,
                                  title: "Lecture Record",
                                  url: rUrl,
                                  sourceType: rUrl.includes('spotify.com') ? "spotify" : "external"
                                }
                             });
                           }
                        }
                     }
                  }
                }
              }
            }
          }
        }
      }, {
        maxWait: 15000,
        timeout: 120000 // 2 minutes to allow huge structures to be inserted safely
      });

      return NextResponse.json({ ok: true, agentTasks });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });

  } catch (e: any) {
    console.error("[ai-architect] error", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
