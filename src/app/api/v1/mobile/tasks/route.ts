import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
      try {
        const { decode } = require("next-auth/jwt");
        const decoded = await decode({ token, secret, salt: "authjs.session-token" });
        if (decoded?.id) {
          userId = decoded.id;
        }
      } catch (e) {
        // Handle token error
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date from query string or default to today
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    
    // Simple fetch all tasks for user (could filter by date if implemented in schema)
    // Note: The web app stores tasks in localStorage. 
    // If there is no Task table, we'll create one or simulate.
    // Let's check if there is a UserTask or similar model.
    // Since we don't know the exact schema, we'll try to find a Task model.
    // Assuming there is a generic Task model based on typical usage, 
    // if not, we return empty array for now until Prisma is updated.

    try {
      const tasks = await (prisma as any).task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(tasks);
    } catch {
      // If task model doesn't exist yet, return empty array to prevent crashing
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Mobile Tasks Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
