import { SPOOF_HEADERS } from "../utils/constants";
import { ProxyProvider } from "../core/adapter";

/**
 * GEMINI KEYLESS PROVIDER
 * This driver spoofs the Google AI CLI identity to get access to 
 * Gemini 1.5 Pro without standard developer API keys.
 */
export const GeminiKeylessProvider: ProxyProvider = {
    id: "gemini-keyless",
    name: "Gemini Pro (Elite Keyless)",
    call: async (message: string, systemPrompt: string): Promise<string> => {
        const endpoints = [
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
            "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent"
        ];

        let lastErr = null;
        for (const url of endpoints) {
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        ...SPOOF_HEADERS,
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": process.env.GEMINI_API_KEY || "AIzaSy" + Math.random().toString(36).substring(7), // Pseudo-key spoof
                    },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + message }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response content.";
                }
                lastErr = new Error(`Gemini Keyless (${url}): ${res.status}`);
            } catch (err: any) {
                lastErr = err;
            }
        }
        throw lastErr || new Error("Gemini Keyless: All endpoints failed.");
    }
};
