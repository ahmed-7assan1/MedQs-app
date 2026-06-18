import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const quiz = await prisma.savedQuiz.findUnique({
      where: { shareCode: params.code },
    });

    if (!quiz) {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#050505",
              color: "white",
              fontFamily: "sans-serif",
            }}
          >
            <p style={{ fontSize: 32, opacity: 0.6 }}>Quiz not found</p>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    const title = quiz.title as string;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#050505",
            padding: "80px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#818cf8",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              MedOneX
            </div>
            <div
              style={{
                width: 80,
                height: 4,
                background: "linear-gradient(90deg, #818cf8, #a855f7)",
                borderRadius: 2,
              }}
            />
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "white",
                textAlign: "center",
                maxWidth: 800,
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 20,
                color: "#9ca3af",
                marginTop: 8,
              }}
            >
              Interactive Quiz · AI-Powered
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#050505",
            color: "white",
            fontSize: 32,
          }}
        >
          MedOneX Quiz
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
