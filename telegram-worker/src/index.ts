import { Hono } from "hono";
import { createBot } from "./lib";
import { setSql, initDb } from "./lib/helpers";
import { callAI, PROVIDER_MODELS } from "./lib/ai";
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

// ─── JWT Auth Middleware ────────────────────────────────────────────────

async function jwtMiddleware(c: any, next: any) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  const token = authHeader.slice(7);
  const secret = c.env.WORKER_JWT_SECRET;
  if (!secret) {
    console.warn("WORKER_JWT_SECRET not set, skipping JWT validation");
    return next();
  }
  try {
    const encoder = new TextEncoder();
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT format");
    const data = `${parts[0]}.${parts[1]}`;
    const signature = Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false, ["verify"]
    );
    const valid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));
    if (!valid) throw new Error("Invalid signature");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    c.set("jwtPayload", payload);
    return next();
  } catch (e: any) {
    return c.json({ error: "Invalid JWT token" }, 401);
  }
}

// ─── AI Routes ──────────────────────────────────────────────────────────

app.post("/v1/generate", jwtMiddleware, async (c) => {
  try {
    const { provider, model, messages, apiKey, temperature, maxTokens } = await c.req.json();

    if (!provider || !model || !messages) {
      return c.json({ error: "Missing required fields: provider, model, messages" }, 400);
    }

    const cfg = PROVIDER_MODELS[provider];
    if (!cfg) {
      return c.json({ error: `Unknown provider: ${provider}` }, 400);
    }

    const key = apiKey || c.env[`${provider.toUpperCase()}_API_KEY`];
    if (!key) {
      return c.json({ error: `No API key available for ${provider}` }, 400);
    }

    const result = await callAI(provider, key, model, cfg.baseURL, messages, undefined, maxTokens);
    return c.json({ content: result });
  } catch (e: any) {
    console.error("/v1/generate error:", e);
    return c.json({ error: e.message || "Internal error" }, 500);
  }
});

app.post("/v1/test-key", jwtMiddleware, async (c) => {
  try {
    const { provider, apiKey } = await c.req.json();
    if (!provider || !apiKey) {
      return c.json({ valid: false, error: "Missing provider or apiKey" }, 400);
    }

    const cfg = PROVIDER_MODELS[provider];
    if (!cfg) {
      return c.json({ valid: false, error: `Unknown provider: ${provider}` });
    }

    const testMessages = [{ role: "user", content: "Respond with exactly: OK" }];
    const result = await callAI(provider, apiKey, cfg.model, cfg.baseURL, testMessages);

    if (result && !result.startsWith("❌")) {
      return c.json({ valid: true });
    }
    return c.json({ valid: false, error: "Key test failed: unexpected response" });
  } catch (e: any) {
    return c.json({ valid: false, error: e.message || "Key validation failed" });
  }
});

app.get("/v1/models", jwtMiddleware, async (c) => {
  const provider = c.req.query("provider");
  if (provider) {
    const cfg = PROVIDER_MODELS[provider];
    if (!cfg) {
      return c.json({ error: `Unknown provider: ${provider}` }, 400);
    }
    return c.json({ models: [cfg.model] });
  }
  const allModels: Record<string, string[]> = {};
  for (const [p, cfg] of Object.entries(PROVIDER_MODELS)) {
    allModels[p] = [cfg.model];
  }
  return c.json({ models: allModels });
});

export default app;
