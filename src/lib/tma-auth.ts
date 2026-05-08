import crypto from 'crypto';

/**
 * Verifies the authenticity of data received from the Telegram Mini App.
 * @param initData The raw initData string from Telegram.
 * @param botToken The bot token from environment variables.
 */
export function verifyTelegramInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const sortedParams = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(sortedParams)
    .digest('hex');

  return calculatedHash === hash;
}

export function parseTelegramUser(initData: string) {
  try {
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    if (!userJson) return null;
    return JSON.parse(userJson);
  } catch (err) {
    console.error("[TMA-AUTH] Failed to parse user data:", err);
    return null;
  }
}
