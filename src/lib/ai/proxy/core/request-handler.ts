import { adapterRegistry } from "./adapter";
import { providerPoolManager } from "./provider-pool-manager";
import { GeminiKeylessProvider } from "../providers/gemini";
import { DuckDuckGoProxyProvider } from "../providers/duckduckgo";
import { ClaudeEliteProvider } from "../providers/claude";
import { LMArenaProvider } from "../providers/lmarena";

// Register all ported providers to the registry
// WE ONLY REGISTER STABLE BRIDGES FOR NOW TO AVOID 404s
adapterRegistry.register(LMArenaProvider);
// adapterRegistry.register(GeminiKeylessProvider); // DISABLED UNTIL FIXED
adapterRegistry.register(DuckDuckGoProxyProvider);
adapterRegistry.register(ClaudeEliteProvider);

// Manually register specific model mappings to the Pool Manager for Failover
console.info("[InternalProxy] Initializing Provider Pools...");
providerPoolManager.registerProvider("claude-3-5-sonnet", LMArenaProvider);
providerPoolManager.registerProvider("claude-3-5-sonnet", ClaudeEliteProvider);
providerPoolManager.registerProvider("claude-3.5-sonnet", LMArenaProvider);

providerPoolManager.registerProvider("gemini-1.5-pro", LMArenaProvider);
providerPoolManager.registerProvider("gemini-1-5-pro", LMArenaProvider);
providerPoolManager.registerProvider("gemini-1.5-flash", LMArenaProvider);
providerPoolManager.registerProvider("gemini-1-5-flash", LMArenaProvider);

// Universal Fallback: DuckDuckGo is extremely stable
providerPoolManager.registerProvider("gemini-1.5-pro", DuckDuckGoProxyProvider);
providerPoolManager.registerProvider("claude-3-5-sonnet", DuckDuckGoProxyProvider);
providerPoolManager.registerProvider("gpt-4o", DuckDuckGoProxyProvider);

providerPoolManager.registerProvider("gpt-4o", DuckDuckGoProxyProvider);
providerPoolManager.registerProvider("gpt-4o-mini", DuckDuckGoProxyProvider);

providerPoolManager.registerProvider("gpt-4o", DuckDuckGoProxyProvider);
providerPoolManager.registerProvider("gpt-4.o", DuckDuckGoProxyProvider);
providerPoolManager.registerProvider("gpt-4o-mini", DuckDuckGoProxyProvider);

/**
 * Main entry point for the internal proxy engine.
 */
export const InternalProxyEngine = {
    async generateReply(model: string, message: string, systemPrompt: string = "You are a helpful AI assistant.") {
        console.info(`[InternalProxy] Handling request for model: ${model}`);
        
        try {
            return await adapterRegistry.routeRequest(model, message, systemPrompt);
        } catch (error: any) {
            console.error(`[InternalProxy] Fatal Error: ${error.message}`);
            throw error;
        }
    }
};
