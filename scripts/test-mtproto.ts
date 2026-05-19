import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import * as dotenv from "dotenv";

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";
const sessionString = process.env.TELEGRAM_STRING_SESSION || "";

async function main() {
  console.log("Starting MTProto test...");
  const client = new TelegramClient(
    new StringSession(sessionString),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();
  console.log("Connected.");

  const messages = await client.getMessages("Datawithoutyoutube", { ids: [3622] });
  const msg = messages?.[0];
  
  if (!msg || !msg.media || !msg.media.document) {
    console.log("No document found.");
    process.exit(1);
  }

  console.log("Document size:", msg.media.document.size.toString());
  
  let totalBytes = 0;
  for await (const chunk of client.iterDownload({
    file: msg.media.document,
    offset: BigInt(0),
    limit: 5 * 1024 * 1024, // first 5MB
    requestSize: 1024 * 1024,
  })) {
    totalBytes += chunk.length;
    console.log(`Received chunk: ${chunk.length} bytes, Total: ${totalBytes}`);
  }

  console.log("Test finished successfully.");
  process.exit(0);
}

main().catch(console.error);
