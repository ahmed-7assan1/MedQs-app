
/**
 * Utility for modern file management using Uploadcare.
 * Requires NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY in .env
 */
export const UPLOADCARE_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || 'demopublickey',
  baseCDN: 'https://ucarecdn.com/'
};

/**
 * Returns a transformed URL for optimized delivery (resize, crop, etc.)
 */
export function getOptimizedFileUrl(uuid: string, transformations = ''): string {
  return `${UPLOADCARE_CONFIG.baseCDN}${uuid}/${transformations}`;
}
