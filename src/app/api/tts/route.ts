import { NextRequest } from "next/server";
import { EdgeTTS } from "edge-tts-universal";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  const voice = req.nextUrl.searchParams.get("voice") || "ar-EG-SalmaNeural";
  const rate = req.nextUrl.searchParams.get("rate") || "+0%";
  const pitch = req.nextUrl.searchParams.get("pitch") || "+0Hz";

  if (!text || !text.trim()) {
    return new Response("Missing text parameter", { status: 400 });
  }

  try {
    const tts = new EdgeTTS(text, voice, { rate, volume: "+0%", pitch });
    const result = await tts.synthesize();
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("Edge TTS error:", err);
    return new Response(err.message || "TTS synthesis failed", { status: 500 });
  }
}

export const dynamic = "force-dynamic";
