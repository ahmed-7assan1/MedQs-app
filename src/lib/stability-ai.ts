
/**
 * Utility to generate medical diagrams or lecture thumbnails using Stability AI.
 * Requires STABILITY_API_KEY in .env
 */
export async function generateMedicalVisual(prompt: string): Promise<string | null> {
  let apiKey = process.env.STABILITY_API_KEY;
  
  if (!apiKey) {
    const { prisma } = await import("@/lib/prisma");
    const config = await (prisma.siteConfig as any).findFirst({ select: { stabilityAIKey: true } });
    apiKey = config?.stabilityAIKey || "";
  }

  if (!apiKey) {
    console.error("Stability AI API Key not found.");
    return null;
  }

  try {
    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: `Medical education illustration: ${prompt}, high quality, clinical, clear detail, white background, professional textbook style`,
            },
          ],
          cfg_scale: 7,
          height: 512,
          width: 512,
          steps: 30,
          samples: 1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Stability AI error: ${await response.text()}`);
    }

    const result = await response.json();
    if (result.artifacts && result.artifacts.length > 0) {
      const base64 = result.artifacts[0].base64;
      return `data:image/png;base64,${base64}`;
    }
  } catch (error) {
    console.error("Stability AI generation failed:", error);
  }
  return null;
}
