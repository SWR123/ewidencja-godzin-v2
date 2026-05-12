import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { isAdminUser } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can view logs
    if (!isAdminUser(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 500, // Limit to last 500 logs
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
