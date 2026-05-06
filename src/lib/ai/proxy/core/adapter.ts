import { providerPoolManager } from "./provider-pool-manager";

export interface ProxyProvider {
    id: string;
    name: string;
    call: (message: string, systemPrompt: string) => Promise<string>;
}

class AdapterRegistry {
    private providers: Map<string, ProxyProvider> = new Map();

    register(provider: ProxyProvider) {
        this.providers.set(provider.id, provider);
        // Register to pools based on provider type/capabilities
        if (provider.id === "gemini-keyless" || provider.id === "lmarena-bridge") {
            providerPoolManager.registerProvider("gemini-1.5-pro", provider);
            providerPoolManager.registerProvider("gemini-1-5-pro", provider);
            providerPoolManager.registerProvider("gemini-1.5-flash", provider);
            providerPoolManager.registerProvider("gemini-1-5-flash", provider);
        }
        if (provider.id === "claude-elite" || provider.id === "lmarena-bridge") {
            providerPoolManager.registerProvider("claude-3-5-sonnet", provider);
            providerPoolManager.registerProvider("claude-3.5-sonnet", provider);
            providerPoolManager.registerProvider("claude-3-7-sonnet", provider);
        }
        if (provider.id === "duckduckgo-proxy") {
            providerPoolManager.registerProvider("gpt-4o", provider);
            providerPoolManager.registerProvider("gpt-4o-mini", provider);
        }
    }

    getProvider(id: string): ProxyProvider | undefined {
        return this.providers.get(id);
    }

    async routeRequest(model: string, message: string, systemPrompt: string): Promise<string> {
        return await providerPoolManager.executeWithFailover(model, message, systemPrompt);
    }
}

export const adapterRegistry = new AdapterRegistry();
