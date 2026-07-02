import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
      "Set it to a 32-byte hex string (64 hex chars). " +
      "Run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(key, "hex");
}

function encryptKey(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return JSON.stringify({
    encrypted,
    iv: iv.toString("hex"),
    tag,
  });
}

function decryptKey(stored: string): string {
  const key = getEncryptionKey();
  const { encrypted, iv, tag } = JSON.parse(stored);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function maskKey(key: string | null | undefined): string {
  if (!key) return "";
  if (key.length <= 8) return "****" + key.slice(-4);
  return key.slice(0, key.length - 4).replace(/./g, "*") + key.slice(-4);
}

export { encryptKey, decryptKey, maskKey };
