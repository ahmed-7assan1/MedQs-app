import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole } from "@/lib/tenant";
import { fail } from "@/platform/api/envelope";
import { NextRequest, NextResponse } from "next/server";

const ILOVEPDF_API_BASE = "https://api.ilovepdf.com/v1";
const PUBLIC_KEY = process.env.ILOVEPDF_PUBLIC_KEY ?? "";
const SECRET_KEY = process.env.ILOVEPDF_SECRET_KEY ?? "";

/** Get a JWT token from ilovepdf auth endpoint */
async function getIlovePdfToken(): Promise<string> {
  const res = await fetch(`${ILOVEPDF_API_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_key: PUBLIC_KEY }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ilovepdf auth failed: ${err}`);
  }
  const data = await res.json();
  return data.token as string;
}

/** Start a task and get server + task_id */
async function startTask(token: string, tool: string): Promise<{ server: string; task: string }> {
  const res = await fetch(`${ILOVEPDF_API_BASE}/start/${tool}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Start task failed for tool: ${tool}`);
  const data = await res.json();
  return { server: data.server, task: data.task };
}

/** Upload a file to the task server */
async function uploadFile(
  server: string,
  task: string,
  token: string,
  fileBuffer: ArrayBuffer,
  filename: string
): Promise<string> {
  const form = new FormData();
  form.append("task", task);
  form.append("file", new Blob([fileBuffer]), filename);

  const res = await fetch(`https://${server}/v1/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.server_filename as string;
}

/** Process the task with given options */
async function processTask(
  server: string,
  task: string,
  token: string,
  tool: string,
  files: { server_filename: string; filename: string; rotate?: number }[],
  options: Record<string, unknown> = {}
): Promise<void> {
  const res = await fetch(`https://${server}/v1/process`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ task, tool, files, ...options }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Process failed: ${err}`);
  }
}

/** Download the result and return as buffer */
async function downloadResult(server: string, task: string, token: string): Promise<ArrayBuffer> {
  const res = await fetch(`https://${server}/v1/download/${task}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Download failed");
  return res.arrayBuffer();
}

/**
 * POST /api/v1/admin/pdf-tools
 * Body: multipart/form-data
 *   - tool: string (e.g. "compress", "merge", "split", "pdfjpg", etc.)
 *   - file: File (one or more)
 *   - options: JSON string of tool-specific options
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope || !isAdminRole(scope.role)) {
    return fail({ error: "Unauthorized", status: 401 });
  }

  if (!PUBLIC_KEY || !SECRET_KEY) {
    return NextResponse.json(
      { error: "PDF Tools not configured. Add ILOVEPDF_PUBLIC_KEY and ILOVEPDF_SECRET_KEY to environment variables." },
      { status: 503 }
    );
  }

  const formData = await req.formData() as any;
  const tool = formData.get("tool") as string;
  const optionsRaw = formData.get("options") as string | null;
  const options = optionsRaw ? JSON.parse(optionsRaw) : {};

  if (!tool) {
    return NextResponse.json({ error: "tool is required" }, { status: 400 });
  }

  // Collect all uploaded files
  const files: { buffer: ArrayBuffer; name: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("file") && value instanceof Blob) {
      const blob = value as File;
      const buffer = await blob.arrayBuffer();
      files.push({ buffer, name: (blob as File).name || "file.pdf" });
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
  }

  try {
    // 1. Auth
    const token = await getIlovePdfToken();

    // 2. Start task
    const { server, task } = await startTask(token, tool);

    // 3. Upload all files
    const uploadedFiles = await Promise.all(
      files.map(async (f) => {
        const serverFilename = await uploadFile(server, task, token, f.buffer, f.name);
        return { server_filename: serverFilename, filename: f.name };
      })
    );

    // Add default options for complex tools if they are missing
    if (tool === "pagenumber" && !Object.keys(options).length) {
      options.font_family = "Arial";
      options.font_size = 12;
      options.vertical_position = "bottom";
      options.horizontal_position = "center";
      options.pages = "all";
    }
    if (tool === "imagepdf" && !Object.keys(options).length) {
      options.orientation = "portrait";
      options.margin = 0;
      options.pagesize = "fit";
    }

    // 4. Process
    console.log(`[PDF Tools] Processing task ${task} with tool ${tool}...`);
    await processTask(server, task, token, tool, uploadedFiles, options);

    // 5. Download result
    console.log(`[PDF Tools] Downloading result for task ${task}...`);
    const resultBuffer = await downloadResult(server, task, token);

    const size = resultBuffer.byteLength;
    console.log(`[PDF Tools] Success! Result size: ${size} bytes`);

    if (size === 0) {
      throw new Error(`The PDF engine returned an empty file for tool: ${tool}. This usually means the input files or options were invalid.`);
    }

    // Determine original filename logic
    let filename = `result_${tool}.pdf`;
    const zipTools = ["pdfjpg", "split"];
    if (zipTools.includes(tool) || (tool === "compress" && files.length > 1)) {
      filename = `result_${tool}.zip`;
    }

    // Use a generic content type to avoid IDM interception during fetch
    const contentType = "application/octet-stream";

    // Return with explicit Content-Length to prevent browser timeouts
    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": size.toString(),
        "X-Filename": encodeURIComponent(filename), 
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Task-Id": task,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF processing failed";
    console.error("[PDF Tools]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
