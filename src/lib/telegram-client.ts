import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";
const sessionString = process.env.TELEGRAM_STRING_SESSION || ""; // Get this by running a script locally once

/**
 * 🛰️ Telegram Client Singleton
 * This handles the MTProto connection to bypass Bot API limits.
 */
class TelegramClientManager {
  private static instance: TelegramClient | null = null;

  static async getInstance(): Promise<TelegramClient> {
    if (this.instance) return this.instance;

    if (!apiId || !apiHash) {
      throw new Error("TELEGRAM_API_ID and TELEGRAM_API_HASH are required in .env for video streaming.");
    }

    const client = new TelegramClient(
      new StringSession(sessionString),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );

    await client.connect();
    this.instance = client;
    return client;
  }
}

export const getTelegramClient = () => TelegramClientManager.getInstance();
