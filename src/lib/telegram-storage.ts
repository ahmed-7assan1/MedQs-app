
import { Telegraf } from 'telegraf';
import { prisma } from './prisma';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const STORAGE_GROUP_ID = process.env.TELEGRAM_STORAGE_GROUP_ID;

/**
 * Sends a file URL to the Telegram storage group and returns the message info.
 */
export async function syncFileToTelegram(url: string, fileName: string, mimeType: string) {
  if (!STORAGE_GROUP_ID) {
    console.warn('[TELEGRAM-STORAGE] No STORAGE_GROUP_ID configured, skipping sync.');
    return null;
  }

  try {
    console.log(`[TELEGRAM-STORAGE] Syncing file to Telegram: ${fileName} (${url})`);
    
    let message: any;
    let fileId: string | undefined;

    // Use sendDocument for images as well to ensure "Highest Quality" (no compression)
    if (mimeType.startsWith('image/')) {
      message = await bot.telegram.sendDocument(STORAGE_GROUP_ID, url, { caption: fileName });
      fileId = message.document.file_id;
    } else if (mimeType.startsWith('video/')) {
      message = await bot.telegram.sendVideo(STORAGE_GROUP_ID, url, { caption: fileName });
      fileId = message.video.file_id;
    } else if (mimeType.startsWith('audio/')) {
      message = await bot.telegram.sendAudio(STORAGE_GROUP_ID, url, { caption: fileName });
      fileId = message.audio.file_id;
    } else {
      // Default to document for PDFs and others
      message = await bot.telegram.sendDocument(STORAGE_GROUP_ID, url, { caption: fileName });
      fileId = message.document.file_id;
    }

    return {
      messageId: message.message_id,
      chatId: STORAGE_GROUP_ID,
      fileId
    };
  } catch (err) {
    console.error('[TELEGRAM-STORAGE] Sync failed:', err);
    return null;
  }
}

/**
 * Helper to update a LectureFile with telegram info
 */
export async function updateLectureFileWithTelegram(fileId: string, url: string, name: string, mimeType: string) {
  const tgInfo = await syncFileToTelegram(url, name, mimeType);
  if (tgInfo) {
    await prisma.lectureFile.update({
      where: { id: fileId },
      data: {
        telegramMessageId: tgInfo.messageId,
        telegramChatId: tgInfo.chatId,
        telegramFileId: tgInfo.fileId
      }
    });
  }
  return tgInfo;
}

/**
 * Extracts file info from a Telegram message link (t.me/c/XXX/YYY or t.me/XXX/YYY)
 */
export async function extractTelegramFileInfo(link: string) {
  if (!STORAGE_GROUP_ID) return null;

  try {
    // Improved regex to handle:
    // 1. t.me/c/CHAT_ID/MSG_ID
    // 2. t.me/c/CHAT_ID/TOPIC_ID/MSG_ID
    // 3. t.me/USERNAME/MSG_ID
    const parts = link.split('/').filter(p => p.length > 0);
    if (parts.length < 2) return null;

    const messageId = parseInt(parts[parts.length - 1]);
    if (isNaN(messageId)) return null;

    let chatId: string = "";
    const isPrivate = link.includes('/c/');

    if (isPrivate) {
      // For /c/ links, the chat ID is the one right after 'c'
      const cIndex = parts.indexOf('c');
      chatId = parts[cIndex + 1];
      chatId = `-100${chatId}`;
    } else {
      // For public links, it's the one before the message ID
      chatId = `@${parts[parts.length - 2]}`;
    }

    console.log(`[TG-EXTRACT] Extracting from ${chatId} msg ${messageId}`);
    
    // Forward the message to storage group to get a permanent fileId our bot owns
    const forwarded = await bot.telegram.forwardMessage(STORAGE_GROUP_ID, chatId, messageId);
    
    let fileId: string | undefined;
    const msg = forwarded as any;
    if (msg.video) fileId = msg.video.file_id;
    else if (msg.document) fileId = msg.document.file_id;
    else if (msg.audio) fileId = msg.audio.file_id;
    
    return {
      messageId: forwarded.message_id,
      chatId: STORAGE_GROUP_ID,
      fileId
    };
  } catch (err) {
    console.error('[TG-EXTRACT] Failed to extract from link:', err);
    return null;
  }
}

/**
 * Gets a temporary download link for a file from Telegram.
 */
export async function getFileLinkFromTelegram(fileId: string): Promise<string | null> {
  try {
    const link = await bot.telegram.getFileLink(fileId);
    return link.toString();
  } catch (err) {
    console.error('[TELEGRAM-STORAGE] Failed to get file link:', err);
    return null;
  }
}
