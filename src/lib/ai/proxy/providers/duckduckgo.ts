import { ProxyProvider } from "../core/adapter";

/**
 * DuckDuckGo Keyless Provider for Claude & GPT
 * This uses the DDG AI bypass within the internal proxy engine
 */
export const DuckDuckGoProxyProvider: ProxyProvider = {
    id: "duckduckgo-proxy",
    name: "DuckDuckGo Bridge",
    async call(message: string, systemPrompt: string) {
        const vqdRes = await fetch("https://duckduckgo.com/duckchat/v1/status", {
            headers: { 
                "x-vqd-accept": "1",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            }
        });
        
        const vqd = vqdRes.headers.get("x-vqd-4") || vqdRes.headers.get("x-vqd-accept");
        if (!vqd) throw new Error("Internal Proxy: Could not negotiate VQD from DDG Bridge.");

        const res = await fetch("https://duckduckgo.com/duckchat/v1/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-vqd-4": vqd,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Can be customized based on input
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ]
            })
        });

        if (!res.ok) throw new Error(`Internal Proxy DDG Bridge Error: ${res.statusText}`);

        const text = await res.text();
        let fullText = "";
        
        // Parse DDG stream
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

        return fullText || "No response content";
    }
};
