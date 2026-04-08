/**
 * Google Sheets export helper.
 * Requires GOOGLE_SHEETS_SERVICE_ACCOUNT (JSON string) and
 * GOOGLE_SHEETS_SPREADSHEET_ID environment variables.
 *
 * Uses the Sheets REST API v4 with a service account JWT.
 */

interface SheetRow {
  [key: string]: string | number | boolean | null;
}

async function getAccessToken(): Promise<string> {
  const sa = JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT ?? "{}");
  if (!sa.private_key) throw new Error("Service account not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })).toString("base64url");

  // Sign with RS256 — requires Node crypto
  const { createSign } = await import("crypto");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(sa.private_key.replace(/\\n/g, "\n"), "base64url");

  const jwt = `${header}.${payload}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const { access_token } = await tokenRes.json();
  return access_token;
}

export async function exportToSheets(
  sheetName: string,
  rows: SheetRow[]
): Promise<{ spreadsheetUrl: string }> {
  if (!rows.length) throw new Error("No data to export");

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID not set");

  const token = await getAccessToken();
  const headers = Object.keys(rows[0]);
  const values = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))];

  // Clear existing sheet content then write
  const range = `${sheetName}!A1`;
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ range, majorDimension: "ROWS", values }),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.text();
    throw new Error(`Sheets write failed: ${err}`);
  }

  return {
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

/** Append one row (per quiz attempt). Tab defaults to `QuizLive`; create that sheet tab in the spreadsheet or set GOOGLE_SHEETS_QUIZ_LIVE_TAB. */
export async function appendQuizResultRow(row: {
  timestamp: string;
  paperId: string;
  paperTitle: string;
  studentName: string;
  email: string;
  score: number;
  total: number;
  timeSeconds: number;
}): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID not set");

  const tab = (process.env.GOOGLE_SHEETS_QUIZ_LIVE_TAB ?? "QuizLive").trim();
  const token = await getAccessToken();
  const values = [
    [
      row.timestamp,
      row.paperId,
      row.paperTitle,
      row.studentName,
      row.email,
      row.score,
      row.total,
      row.timeSeconds,
    ],
  ];

  const range = `${tab}!A:A`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets append failed: ${err}`);
  }
}
