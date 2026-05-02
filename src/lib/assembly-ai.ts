
import { AssemblyAI } from 'assemblyai';

/**
 * Utility to transcribe audio/video files using AssemblyAI.
 * Requires ASSEMBLYAI_API_KEY in .env
 */
export async function transcribeMedia(fileUrl: string) {
  let apiKey = process.env.ASSEMBLYAI_API_KEY;
  
  if (!apiKey) {
    const { prisma } = await import("@/lib/prisma");
    const config = await (prisma.siteConfig as any).findFirst({ select: { assemblyAIKey: true } });
    apiKey = config?.assemblyAIKey || "";
  }

  if (!apiKey) {
    throw new Error("AssemblyAI API Key not found in environment or database.");
  }

  const client = new AssemblyAI({ apiKey });

  const params = {
    audio: fileUrl,
    speaker_labels: true,
    punctuate: true,
    format_text: true,
  };

  const transcript = await client.transcripts.transcribe(params);

  if (transcript.status === 'error') {
    throw new Error(`Transcription failed: ${transcript.error}`);
  }

  return {
    text: transcript.text,
    utterances: transcript.utterances,
    id: transcript.id
  };
}
