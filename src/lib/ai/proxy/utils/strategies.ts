import { SPOOF_HEADERS, TERMINAL_HEADERS } from "./constants";

/**
 * Provider Strategies ported from BlacklistedAIProxy
 * These define how different models should be routed or handled.
 */

export interface RoutingStrategy {
    id: string;
    description: string;
    getHeaders: () => Record<string, string>;
}

export const STRATEGIES: Record<string, RoutingStrategy> = {
    BROWSER_SPOOF: {
        id: "browser-spoof",
        description: "Mimics a standard Chrome browser session.",
        getHeaders: () => ({ ...SPOOF_HEADERS })
    },
    TERMINAL_SPOOF: {
        id: "terminal-spoof",
        description: "Mimics a cURL or CLI terminal request.",
        getHeaders: () => ({ ...TERMINAL_HEADERS })
    },
    MOBILE_SPOOF: {
        id: "mobile-spoof",
        description: "Mimics an iPhone/Safari mobile session.",
        getHeaders: () => ({
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })
    }
};

/**
 * Logic to determine the best strategy based on model or context
 */
export function determineStrategy(model: string): RoutingStrategy {
    if (model.includes("gpt-4") || model.includes("claude-3-5")) {
        return STRATEGIES.BROWSER_SPOOF;
    }
    if (model.includes("gemini")) {
        return STRATEGIES.MOBILE_SPOOF;
    }
    return STRATEGIES.TERMINAL_SPOOF;
}
