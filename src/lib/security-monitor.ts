import { prisma } from "@/lib/prisma";
import { redis, redisIncrWithExpire } from "@/lib/redis";
import type { SecurityEventSeverity, SecurityEventType, SecurityEventStatus } from "@prisma/client";

const SUSPICIOUS_PATTERNS = [
  { pattern: /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, type: "SQL_INJECTION_ATTEMPT" as SecurityEventType },
  { pattern: /(<script)|(<\/script>)|(javascript:)|(onerror=)|(onload=)/i, type: "XSS_ATTEMPT" as SecurityEventType },
  { pattern: /(union\s+select)|(select\s+.*\s+from)|(insert\s+into)|(drop\s+table)|(delete\s+from)/i, type: "SQL_INJECTION_ATTEMPT" as SecurityEventType },
];

const SEVERITY_MAP: Record<string, SecurityEventSeverity> = {
  LOGIN_FAILURE: "LOW",
  LOGIN_SUCCESS_UNUSUAL_LOCATION: "MEDIUM",
  BRUTE_FORCE_ATTEMPT: "HIGH",
  SPAM_DETECTED: "MEDIUM",
  SQL_INJECTION_ATTEMPT: "CRITICAL",
  XSS_ATTEMPT: "CRITICAL",
  RATE_LIMIT_EXCEEDED: "LOW",
  SUSPICIOUS_ACTIVITY: "MEDIUM",
  API_ABUSE: "HIGH",
  INVALID_TOKEN_USAGE: "MEDIUM",
  UNAUTHORIZED_ACCESS: "HIGH",
  DATA_SCRAPING_ATTEMPT: "MEDIUM",
  FILE_UPLOAD_ABUSE: "MEDIUM",
  AI_ABUSE_ATTEMPT: "MEDIUM",
  ACCOUNT_TAKEOVER_ATTEMPT: "CRITICAL",
};

export function detectSuspiciousPayload(input: string): SecurityEventType | null {
  for (const { pattern, type } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(input)) return type;
  }
  return null;
}

interface LogSecurityEventParams {
  type: SecurityEventType;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  endpoint?: string | null;
  requestMethod?: string | null;
  requestPayload?: Record<string, unknown> | null;
  headers?: Record<string, unknown> | null;
  description?: string | null;
}

export async function logSecurityEvent(params: LogSecurityEventParams) {
  const severity = SEVERITY_MAP[params.type] ?? "MEDIUM";
  try {
    await prisma.securityEvent.create({
      data: {
        type: params.type,
        severity,
        userId: params.userId ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        endpoint: params.endpoint ?? null,
        requestMethod: params.requestMethod ?? null,
        requestPayload: params.requestPayload ?? undefined as any,
        headers: params.headers ?? undefined as any,
        description: params.description ?? null,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[security-monitor] failed to log event:", err instanceof Error ? err.message : err);
    }
  }
}

export async function checkBruteForce(identifier: string, maxAttempts = 5, windowSec = 300): Promise<boolean> {
  const key = `bruteforce:${identifier}`;
  const count = await redisIncrWithExpire(key, windowSec);
  if (count >= maxAttempts) {
    await logSecurityEvent({
      type: "BRUTE_FORCE_ATTEMPT",
      description: `Brute force detected for ${identifier}: ${count} attempts in ${windowSec}s window`,
      ipAddress: identifier.startsWith("ip:") ? identifier.slice(3) : null,
    });
    return true;
  }
  return false;
}

export async function checkRateLimitViolation(userId: string, endpoint: string, maxRequests = 60, windowSec = 60) {
  const key = `ratelimit:${userId}:${endpoint}`;
  const count = await redisIncrWithExpire(key, windowSec);
  if (count > maxRequests) {
    await logSecurityEvent({
      type: "RATE_LIMIT_EXCEEDED",
      userId,
      endpoint,
      description: `Rate limit exceeded: ${count} requests to ${endpoint} in ${windowSec}s`,
    });
  }
  return count;
}

export async function detectDataScraping(ipAddress: string, endpoint: string): Promise<boolean> {
  const key = `scraping:${ipAddress}`;
  const count = await redisIncrWithExpire(key, 60);
  if (count > 100) {
    await logSecurityEvent({
      type: "DATA_SCRAPING_ATTEMPT",
      ipAddress,
      endpoint,
      description: `Potential scraping: ${count} requests/min from ${ipAddress}`,
    });
    return true;
  }
  return false;
}

export async function checkIncomingRequest(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const searchParams = url.searchParams;
  const combined = path + "?" + searchParams.toString();

  const suspicious = detectSuspiciousPayload(combined);
  if (suspicious) {
    await logSecurityEvent({
      type: suspicious,
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
      endpoint: path,
      requestMethod: request.method,
      requestPayload: Object.fromEntries(searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries()),
      description: `Suspicious payload detected in request to ${path}`,
    });
    return true;
  }

  return false;
}

export async function getOpenSecurityEventCount(): Promise<number> {
  try {
    return await prisma.securityEvent.count({
      where: { status: { in: ["NEW", "INVESTIGATING"] as SecurityEventStatus[] } },
    });
  } catch {
    return 0;
  }
}

export async function getRecentSecurityAlerts(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return prisma.securityEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
