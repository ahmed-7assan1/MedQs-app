
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
