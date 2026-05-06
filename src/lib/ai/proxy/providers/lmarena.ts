import { ProxyProvider } from "../core/adapter";
import { SPOOF_HEADERS } from "../utils/constants";

/**
 * LMArena Bridge Provider ported from BlacklistedAIProxy
 * Provides high-stability keyless access to Claude 3.5 Sonnet and other models.
 */
export const LMArenaProvider: ProxyProvider = {
    id: "lmarena-bridge",
    name: "LMArena Elite Bridge",
    async call(message: string, systemPrompt: string) {
        console.info("[InternalProxy] Routing via LMArena Elite Bridge...");
        
        try {
            // Stage 1: Session Initiation
            const sessionRes = await fetch("https://chat.lmsys.org/api/v1/session", {
                method: "POST",
                headers: { 
                    ...SPOOF_HEADERS,
                    "Origin": "https://chat.lmsys.org",
                    "Referer": "https://chat.lmsys.org/",
                    "Accept": "application/json",
                }
            });
            
            if (!sessionRes.ok) throw new Error(`LMArena Session Failed: ${sessionRes.status}`);
            const session = await sessionRes.json();

            // Map internal model name to LMArena model name
            let lmModel = "claude-3-5-sonnet";
            if (message.toLowerCase().includes("gemini") || systemPrompt.toLowerCase().includes("gemini")) {
                 lmModel = "gemini-1.5-pro";
            }
            // Use requested model if possible
            if (message.includes("MODEL:")) {
                const match = message.match(/MODEL:([a-zA-Z0-9.-]+)/);
                if (match) lmModel = match[1];
            }

            // Stage 2: Model Request
            const res = await fetch("https://chat.lmsys.org/api/v1/chat", {
                method: "POST",
                headers: {
                    ...SPOOF_HEADERS,
                    "Authorization": `Bearer ${session.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: lmModel,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message }
                    ]
                })
            });

            if (!res.ok) throw new Error(`LMArena Bridge Error: ${res.statusText}`);

            const data = await res.json();
            return data.choices?.[0]?.message?.content || "No response from LMArena.";
        } catch (err: any) {
            console.error(`[InternalProxy] LMArena Bridge failed: ${err.message}`);
            throw err;
        }
    }
};
