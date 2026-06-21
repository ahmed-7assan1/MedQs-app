import { NextResponse } from "next/server";
import { getBot } from "@/lib/telegram-bot";

let botInitialized = false;

function ensureBot() {
  if (!botInitialized) {
    try {
      getBot();
      botInitialized = true;
    } catch (e: any) {
      console.error("[TELEGRAM] Bot init failed:", e.message);
      throw e;
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.message && !body.callback_query && !body.inline_query) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (body.edited_message) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    ensureBot();

    const bot = getBot();
    await bot.handleUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[TELEGRAM] Webhook Error:", e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 200 });
  }
}
