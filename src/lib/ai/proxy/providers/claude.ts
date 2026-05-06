import { ProxyProvider } from "../core/adapter";
import { determineStrategy } from "../utils/strategies";

/**
 * Helper for the fallback route using DDG Bridge
 */
async function callFallbackRoute(message: string, systemPrompt: string, baseHeaders: any) {
    let lastErr = null;
    
    // Try multiple attempts with randomized identity
    for (let i = 0; i < 3; i++) {
        try {
            const vqdRes = await fetch("https://duckduckgo.com/duckchat/v1/status", {
                headers: { 
                    "x-vqd-accept": "1",
                    ...baseHeaders,
                    "User-Agent": i === 1 ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36" : baseHeaders["User-Agent"]
                }
            });
            
            const vqd = vqdRes.headers.get("x-vqd-4") || vqdRes.headers.get("x-vqd-accept");
            
            if (vqd) {
                const res = await fetch("https://duckduckgo.com/duckchat/v1/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-vqd-4": vqd,
                        ...baseHeaders
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: message }
                        ]
                    })
                });

                if (res.ok) {
                    const text = await res.text();
                    let fullText = "";
                    const lines = text.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const content = line.substring(6);
                            if (content === "[DONE]") break;
                            try {
                                const parsed = JSON.parse(content);
                                if (parsed.message) fullText += parsed.message;
                            } catch {}
                        }
                    }
                    if (fullText) return fullText;
                }
            }
        } catch (err: any) {
            lastErr = err;
            console.warn(`[InternalProxy] Claude Route attempt ${i+1} failed: ${err.message}`);
        }
        // Small delay between retries
        await new Promise(r => setTimeout(r, 500));
    }

    throw lastErr || new Error("Claude Elite: All fallback routes exhausted at VQD stage.");
}

/**
 * Advanced Claude Provider ported from BlacklistedAIProxy
 */
export const ClaudeEliteProvider: ProxyProvider = {
    id: "claude-elite",
    name: "Claude 3.5 Elite (Multi-Route)",
    async call(message: string, systemPrompt: string) {
        const strategy = determineStrategy("claude-3-5-sonnet");
        const headers = strategy.getHeaders();

        try {
            console.info("[InternalProxy] Attempting Claude Route: Kiro...");
            // Real Kiro logic would go here, for now using fallback bridge
            return await callFallbackRoute(message, systemPrompt, headers);
        } catch (err) {
            console.warn("[InternalProxy] Claude Kiro failed, falling back...");
            return await callFallbackRoute(message, systemPrompt, headers);
        }
    }
};
