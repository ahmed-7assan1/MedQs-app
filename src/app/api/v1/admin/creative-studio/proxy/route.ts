import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "image";
  const prompt = searchParams.get("prompt");
  const model = searchParams.get("model");
  const seed = searchParams.get("seed") || Math.floor(Math.random() * 1000000).toString();
  const system = searchParams.get("system") || "You are a helpful assistant.";

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  let pollinationsUrl = "";
  if (type === "text") {
    pollinationsUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model || "openai"}&seed=${seed}&system=${encodeURIComponent(system)}`;
  } else {
    const width = searchParams.get("width") || "1024";
    const height = searchParams.get("height") || "1024";
    const nologo = searchParams.get("nologo") || "true";
    pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${model || "flux"}&seed=${seed}&width=${width}&height=${height}&nologo=${nologo}`;
  }

  try {
    console.log(`[Creative Proxy] Fetching ${type}:`, pollinationsUrl);
    const res = await fetch(pollinationsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Creative Proxy] Error from Pollinations:", errText);
      return NextResponse.json({ error: "Failed to fetch from AI service" }, { status: res.status });
    }

    if (type === "text") {
      const text = await res.text();
      return new NextResponse(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } else {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (error) {
    console.error("[Creative Proxy] Fatal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
