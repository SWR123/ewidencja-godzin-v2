import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

// Archive records
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    // Get record names for logging
    const records = await prisma.record.findMany({
      where: { id: { in: ids } },
      select: { nazwisko: true, imie: true }
    });

    // Archive records
    await prisma.record.updateMany({
      where: { id: { in: ids } },
      data: { 
        isArchived: true,
        archivedAt: new Date()
      },
    });

    const recordNames = records.map((r: { nazwisko: string; imie: string }) => `${r.nazwisko} ${r.imie}`).join(", ");
    await logActivity(
      session.user?.id || "",
      session.user?.name || "Nieznany",
      session.user?.email || "",
      "Archiwizacja rekordów",
      `Zarchiwizowano ${ids.length} rekord(ów): ${recordNames}`
    );

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Archive error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Restore from archive
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    // Get record names for logging
    const records = await prisma.record.findMany({
      where: { id: { in: ids } },
      select: { nazwisko: true, imie: true }
    });

    // Restore records
    await prisma.record.updateMany({
      where: { id: { in: ids } },
      data: { 
        isArchived: false,
        archivedAt: null
      },
    });

    const recordNames = records.map((r: { nazwisko: string; imie: string }) => `${r.nazwisko} ${r.imie}`).join(", ");
    await logActivity(
      session.user?.id || "",
      session.user?.name || "Nieznany",
      session.user?.email || "",
      "Przywrócenie z archiwum",
      `Przywrócono ${ids.length} rekord(ów): ${recordNames}`
    );

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
