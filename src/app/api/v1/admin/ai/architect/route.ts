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

  return clean.join("\n").slice(0, 120000); // safety cap to fit AI context windows
}

export const runtime = "nodejs";
export const maxDuration = 300;

async function fileToText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = (file.name || "").toLowerCase();
  
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
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
        if (!("str" in item)) continue;
        const transform = item.transform;
        const x = transform[4];
        const y = transform[5]; 

        let matchedLink = null;
        for (const link of links) {
          if (!link.rect) continue;
          const [x1, y1, x2, y2] = link.rect;
          if (x >= x1 - 5 && x <= x2 + 5 && y >= y1 - 5 && y <= y2 + 5) {
             matchedLink = link.url;
             break;
          }
        }

        let textStr = item.str;
        if (!matchedLink) {
           const urlRegex = /(https?:\/\/[^\s)]+)/g;
           const match = urlRegex.exec(textStr);
           if (match) matchedLink = match[1];
        }

        if (matchedLink) textStr = `[${textStr}](${matchedLink})`;

        if (lastY !== -1 && Math.abs(y - lastY) > 5) {
           fullText += textLine + '\n';
           textLine = textStr;
        } else {
           if (textLine && !textLine.endsWith(' ') && !textStr.startsWith(' ')) {
             textLine += ' ';
           }
           textLine += textStr;
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
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !isAdminRole(user.role)) return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const form = await req.formData() as any;
    const mode = String(form.get("mode") || "analyze");
    const scope = String(form.get("scope") || "semester");
    const semesterId = String(form.get("semesterId") || "");
    const wipesExisting = String(form.get("wipe") || "0") === "1";

    if (!semesterId) return NextResponse.json({ error: "semesterId required" }, { status: 400 });

    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: { academicYear: { include: { faculty: true } } }
    });
    if (!semester) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

    if (mode === "analyze") {
      const file = form.get("file") as File | null;
      const rawText = String(form.get("text") || "").trim();
      const personalKey = String(form.get("apiKey") || "");
      const personalProvider = String(form.get("provider") || "puter");
      let text = rawText;

      if (file) text = await fileToText(file);
      if (!text) return NextResponse.json({ error: "No text found in input" }, { status: 422 });
      
      const cap = compactText(text);
      const systemPrompt = `You are a professional medical curriculum architect. 
Extract a nested JSON structure: MODULES -> SUBJECTS -> LECTURES.
Return ONLY valid JSON:
{ "modules": [{ "name": "...", "subjects": [{ "name": "...", "lectures": [{ "title": "...", "videoUrls": [], "fileUrls": [], "recordUrls": [] }] }] }] }
Accuracy is CRITICAL. Extract ALL lectures and links.`;

      const prompt = `Extract for ${semester.name}. GUIDE TEXT:\n${cap}`;
      const fallback = { modules: [] };
      const row = await generateJsonWithFallback<typeof fallback>(prompt, fallback, {
        systemPrompt,
        preferredProvider: personalProvider,
        personalKey: personalKey || undefined,
      });

      return NextResponse.json({ ok: true, structure: row.data });
    }

    if (mode === "commit") {
      const rawStructure = String(form.get("structure") || "");
      if (!rawStructure) return NextResponse.json({ error: "Structure JSON required" }, { status: 400 });
      const structure = JSON.parse(rawStructure);

      for (const mData of structure.modules) {
        for (const sData of mData.subjects || []) {
          for (const lec of sData.lectures || []) {
            if (typeof lec === 'object') {
              const uniqueVideos = new Set<string>();
              const uniqueFiles = new Set<string>();
              const uniqueRecords = new Set<string>();
              lec.extractedVideos = [];
              const rawVideos = Array.isArray(lec.videoUrls) ? lec.videoUrls : (lec.videoUrl ? [lec.videoUrl] : []);
              const rawFiles = Array.isArray(lec.fileUrls) ? lec.fileUrls : (lec.fileUrl ? [lec.fileUrl] : []);
              const rawRecords = Array.isArray(lec.recordUrls) ? lec.recordUrls : [];

              for (const url of rawVideos) {
                if (!url || uniqueVideos.has(url)) continue;
                if (url.includes('youtube.com') || url.includes('youtu.be') || url.endsWith('.mp4')) {
                  uniqueVideos.add(url);
                  lec.extractedVideos.push({ url, title: "Lecture Video" });
                } else {
                  try {
                    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
                    if (res.ok) {
                      const t = await res.text();
                      const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)[^"'\s<>]+)/g;
                      let m; while ((m = ytRegex.exec(t)) !== null) {
                        if (!uniqueVideos.has(m[1])) { uniqueVideos.add(m[1]); lec.extractedVideos.push({ url: m[1], title: "Scraped Video" }); }
                      }
                      const fRegex = /(https?:\/\/[^"'\s<>]+\.(?:pdf|pptx?|docx?))/gi;
                      while ((m = fRegex.exec(t)) !== null) { if (!uniqueFiles.has(m[1])) uniqueFiles.add(m[1]); }
                    }
                  } catch {}
                }
              }
              for (const url of rawFiles) {
                if (!url || uniqueFiles.has(url)) continue;
                if (url.toLowerCase().endsWith('.pdf')) uniqueFiles.add(url);
                else {
                  try {
                    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
                    if (res.ok) {
                      const t = await res.text();
                      const fRegex = /(https?:\/\/[^"'\s<>]+\.(?:pdf|pptx?|docx?))/gi;
                      let m; while ((m = fRegex.exec(t)) !== null) { if (!uniqueFiles.has(m[1])) uniqueFiles.add(m[1]); }
                    }
                  } catch {}
                }
              }
              for (const url of rawRecords) { if (url && !uniqueRecords.has(url)) uniqueRecords.add(url); }
              lec.videoUrls = Array.from(uniqueVideos);
              lec.fileUrls = Array.from(uniqueFiles);
              lec.recordUrls = Array.from(uniqueRecords);
            }
          }
        }
      }

      let agentTasks: any[] = [];
      await prisma.$transaction(async (tx: any) => {
        if (wipesExisting) await tx.module.deleteMany({ where: { semesterId } });
        const existingModules = await tx.module.findMany({ where: { semesterId }, include: { subjects: { include: { lectures: true } } } });

        for (const mData of structure.modules) {
          let mod = existingModules.find((em: any) => semanticMatch(em.name, mData.name));
          if (!mod) {
            mod = await tx.module.create({ data: { name: mData.name, semesterId } });
            existingModules.push({ ...mod, subjects: [] });
          }
          for (const sData of mData.subjects || []) {
            let subject = mod.subjects?.find((es: any) => semanticMatch(es.name, sData.name));
            if (!subject) {
              subject = await tx.subject.create({ data: { name: sData.name, moduleId: mod.id } });
              if (!mod.subjects) mod.subjects = [];
              mod.subjects.push({ ...subject, lectures: [] });
            }
            let nextOrder = subject.lectures?.length || 0;
            for (const lecData of sData.lectures || []) {
              const title = typeof lecData === 'string' ? lecData : lecData.title;
              if (!title) continue;
              let lecture = subject.lectures?.find((el: any) => semanticMatch(el.title, title));
              if (!lecture) {
                lecture = await tx.lecture.create({ data: { title, subjectId: subject.id, order: nextOrder++ } });
                if (!subject.lectures) subject.lectures = [];
                subject.lectures.push(lecture);
              }
              if (typeof lecData === 'object') {
                for (const v of (lecData.extractedVideos || [])) {
                  const exists = await tx.lectureVideo.findFirst({ where: { lectureId: lecture.id, url: v.url } });
                  if (!exists) {
                    const nv = await tx.lectureVideo.create({ data: { lectureId: lecture.id, title: v.title, url: v.url } });
                  }
                }
                for (const fUrl of (lecData.fileUrls || [])) {
                  const exists = await tx.lectureFile.findFirst({ where: { lectureId: lecture.id, url: fUrl } });
                  if (!exists) await tx.lectureFile.create({ data: { lectureId: lecture.id, name: "Material", url: fUrl, mimeType: "application/pdf" } });
                  agentTasks.push({ lectureId: lecture.id, lectureTitle: lecture.title, url: fUrl });
                }
                for (const rUrl of (lecData.recordUrls || [])) {
                  const exists = await tx.lectureRecord?.findFirst({ where: { lectureId: lecture.id, url: rUrl } }).catch(() => null);
                  if (!exists && tx.lectureRecord) await tx.lectureRecord.create({ data: { lectureId: lecture.id, title: "Record", url: rUrl } });
                }
              }
            }
          }
        }
      }, { timeout: 120000 });

      return NextResponse.json({ ok: true, agentTasks });
    }
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
