import { Hono } from "hono";
import { createBot } from "./lib";
import { setSql, initDb } from "./lib/helpers";
import postgres from "postgres";

type Bindings = {
  TELEGRAM_BOT_TOKEN: string;
  DATABASE_URL: string;
  NEXTAUTH_URL: string;
  GEMINI_API_KEY: string;
  GEMINI_API_KEY_2?: string;
  GEMINI_API_KEY_3?: string;
  GEMINI_API_KEY_4?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  TELEGRAM_STORAGE_GROUP_ID?: string;
  SUPPORT_TELEGRAM_CHAT_ID?: string;
  [key: string]: string | undefined;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/api/telegram", async (c) => {
  const sql = postgres(c.env.DATABASE_URL, { prepare: false, max: 1 });
  try {
    setSql(sql);
    await initDb();
    const bot = createBot(c.env);
    const body = await c.req.json();
    await bot.handleUpdate(body);
    return c.json({ ok: true });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return c.json({ ok: false, error: e.message }, 200);
  } finally {
    await sql.end().catch(() => {});
  }
});

app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ success: false, error: "No file" }, 400);

    const mime = file.type || "application/octet-stream";
    let method = "sendDocument";
    let field = "document";
    if (mime.startsWith("video/")) { method = "sendVideo"; field = "video"; }
    else if (mime.startsWith("audio/")) { method = "sendAudio"; field = "audio"; }

    const tgForm = new FormData();
    tgForm.append("chat_id", c.env.TELEGRAM_STORAGE_GROUP_ID || "");
    tgForm.append(field, file);

    const res = await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      body: tgForm,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown");
      return c.json({ success: false, error: errText }, 502);
    }

    const data: any = await res.json();
    if (!data.ok) return c.json({ success: false, error: data.description }, 502);

    const msg = data.result;
    let fileId = "";
    if (msg.document) fileId = msg.document.file_id;
    else if (msg.video) fileId = msg.video.file_id;
    else if (msg.audio) fileId = msg.audio.file_id;
    else if (msg.photo?.[0]) fileId = msg.photo[0].file_id;

    return c.json({ success: true, fileId, type: mime, fileName: file.name });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || "Upload failed" }, 500);
  }
});

app.get("/api/files/preview", async (c) => {
  const fileId = c.req.query("fileId");
  const type = c.req.query("type") || "image";
  const download = c.req.query("download") === "true";
  if (!fileId) return c.json({ error: "Missing fileId" }, 400);

  try {
    const getFileRes = await fetch(
      `https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`
    );
    if (!getFileRes.ok) return c.json({ error: "Failed to get file info" }, 502);

    const getFileData: any = await getFileRes.json();
    if (!getFileData.ok) return c.json({ error: getFileData.description || "Not found" }, 404);

    const filePath = getFileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${c.env.TELEGRAM_BOT_TOKEN}/${filePath}`;

    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) return c.json({ error: "Failed to fetch file" }, 502);

    const contentType = type === "video" ? "video/mp4"
      : type === "audio" ? "audio/mpeg"
      : fileRes.headers.get("content-type") || "application/octet-stream";

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    });

    if (download) {
      const fileName = filePath.split("/").pop() || "file";
      headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
    }

    return new Response(fileRes.body, { headers });
  } catch (err: any) {
    return c.json({ error: err.message || "Preview failed" }, 500);
  }
});

app.options("/api/upload", (c) => new Response(null, {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  },
}));

app.options("/api/files/preview", (c) => new Response(null, {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  },
}));

export default app;
