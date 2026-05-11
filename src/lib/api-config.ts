/**
 * 🛰️ MedQs API Configuration
 * 
 * This utility manages the transition between Vercel and External Servers.
 * If NEXT_PUBLIC_AI_BACKEND_URL is set in .env, AI calls will bypass Vercel
 * and go directly to your dedicated server.
 */

export const getAIEndpoint = (path: string): string => {
  const backendUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL;
  
  if (!backendUrl) {
    // Default to relative path (Vercel)
    return path.startsWith("/") ? path : `/${path}`;
  }

  // Ensure backendUrl doesn't have trailing slash and path starts with one
  const base = backendUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  
  return `${base}${p}`;
};
