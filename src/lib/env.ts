const REQUIRED_VARS = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPER_ADMIN_EMAIL",
] as const;

const REQUIRED_IF_REDIS = ["REDIS_URL"] as const;

export function validateEnv(): string[] {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (process.env.REDIS_URL) {
    for (const key of REQUIRED_IF_REDIS) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  return missing;
}

if (process.env.NODE_ENV !== "test") {
  const missing = validateEnv();
  if (missing.length > 0) {
    console.warn(`[ENV] Missing required environment variables: ${missing.join(", ")}`);
  }
}
