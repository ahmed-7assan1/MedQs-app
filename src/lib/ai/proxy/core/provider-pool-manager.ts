import { ProxyProvider } from "./adapter";
import { AI_MODELS } from "../utils/constants";

/**
 * Provider Pool Manager ported from BlacklistedAIProxy
 * Manages multiple providers for different models and handles failover logic.
 */
class ProviderPoolManager {
    private pools: Map<string, ProxyProvider[]> = new Map();
    private healthStatus: Map<string, boolean> = new Map();

    registerProvider(model: string, provider: ProxyProvider) {
        if (!this.pools.has(model)) {
            this.pools.set(model, []);
        }
        this.pools.get(model)?.push(provider);
        this.healthStatus.set(`${model}:${provider.id}`, true);
    }

    getProvidersForModel(model: string): ProxyProvider[] {
        // Return healthy providers first
        const all = this.pools.get(model) || [];
        return all.filter(p => this.healthStatus.get(`${model}:${p.id}`) !== false);
    }

    markAsFailed(model: string, providerId: string) {
        console.warn(`[PoolManager] Marking ${providerId} as failed for ${model}. Retry in 10s...`);
        this.healthStatus.set(`${model}:${providerId}`, false);
        // Reset health after 10 seconds for development stability
        setTimeout(() => {
            console.info(`[PoolManager] Resetting health for ${providerId} (${model})`);
            this.healthStatus.set(`${model}:${providerId}`, true);
        }, 10 * 1000);
    }

    async executeWithFailover(model: string, message: string, systemPrompt: string): Promise<string> {
        let providers = this.getProvidersForModel(model);
        
        // If all marked as failed, FORCE try them anyway instead of giving up
        if (providers.length === 0) {
            console.warn(`[PoolManager] No healthy providers for ${model}. Forcing retry of all registered providers.`);
            providers = this.pools.get(model) || [];
        }

        console.info(`[PoolManager] Executing ${model} via providers: ${providers.map(p => p.id).join(", ")}`);
        
        if (providers.length === 0) {
            throw new Error(`No providers registered for model: ${model}`);
        }

        let lastErr = null;
        for (const provider of providers) {
            try {
                console.info(`[PoolManager] Trying provider: ${provider.id} for ${model}...`);
                const result = await provider.call(message, systemPrompt);
                console.info(`[PoolManager] Provider ${provider.id} succeeded!`);
                return result;
            } catch (err: any) {
                console.error(`[PoolManager] Provider ${provider.id} failed: ${err.message}`);
                this.markAsFailed(model, provider.id);
                lastErr = err;
            }
        }

        throw lastErr || new Error(`All providers for ${model} failed.`);
    }
}

export const providerPoolManager = new ProviderPoolManager();
