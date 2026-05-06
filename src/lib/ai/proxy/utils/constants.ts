export const MODEL_PROTOCOL = {
    OPENAI: 'openai',
    CLAUDE: 'claude',
    GEMINI: 'gemini'
};

export const AI_MODELS = {
    CLAUDE_3_5_SONNET: 'claude-3-5-sonnet',
    CLAUDE_3_5_OPUS: 'claude-3-5-opus',
    CLAUDE_3_7_SONNET: 'claude-3-7-sonnet',
    GEMINI_1_5_PRO: 'gemini-1-5-pro',
    GEMINI_1_5_FLASH: 'gemini-1-5-flash',
    GPT_4O: 'gpt-4o',
    GPT_4O_MINI: 'gpt-4o-mini',
    DEEPSEEK_V3: 'deepseek-v3',
    LLAMA_3_1_405B: 'llama-3.1-405b',
    LLAMA_3_1_70B: 'llama-3.1-70b',
    GROK_2: 'grok-2'
};

export const SPOOF_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://duckduckgo.com/",
    "Origin": "https://duckduckgo.com",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Ch-Ua": '"Not-A.Brand";v="99", "Chromium";v="124"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "X-Requested-With": "XMLHttpRequest"
};

export const TERMINAL_HEADERS = {
    "User-Agent": "curl/8.1.2",
    "Accept": "*/*",
    "Connection": "keep-alive"
};

export const PROVIDER_TYPES = {
    GEMINI_KEYLESS: "gemini-keyless",
    DUCKDUCKGO: "duckduckgo-proxy",
    CLAUDE_ELITE: "claude-elite",
    LMARENA: "lmarena-bridge",
    OPENAI_DIRECT: "openai-direct",
    GROK_PROXY: "grok-proxy"
};
