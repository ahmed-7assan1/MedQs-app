import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const range = req.headers.get("range");

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const driveUrl = `https://drive.google.com/uc?export=download&id=${id}`;
  
  try {
    const response = await fetch(driveUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Range": range || "bytes=0-",
      },
      cache: 'no-store'
    });

    // Handle initial HTML response (virus scan)
    if (response.headers.get("content-type")?.includes("text/html")) {
      const html = await response.text();
      const confirmMatch = html.match(/confirm=([a-zA-Z0-9_]+)/);
      if (confirmMatch) {
        const confirmedUrl = `${driveUrl}&confirm=${confirmMatch[1]}`;
        const confirmedRes = await fetch(confirmedUrl, {
          headers: { "Range": range || "bytes=0-" }
        });
        
        return new NextResponse(confirmedRes.body, {
          status: confirmedRes.status,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Range": confirmedRes.headers.get("content-range") || "",
            "Accept-Ranges": "bytes",
          }
        });
      }
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": response.headers.get("content-range") || "",
        "Accept-Ranges": "bytes",
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Stream error" }, { status: 500 });
  }
}
