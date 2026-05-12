import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Brak identyfikatorów do usunięcia" },
        { status: 400 }
      );
    }

    // Get records before deletion for logging
    const recordsToDelete = await prisma.record.findMany({
      where: { id: { in: ids } },
      select: { nazwisko: true, imie: true },
    });

    await prisma.record.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    // Log activity
    const names = recordsToDelete.map((r: { nazwisko: string; imie: string }) => `${r.nazwisko} ${r.imie}`).join(", ");
    await logActivity(
      session.user?.id || "unknown",
      session.user?.name || "Nieznany",
      session.user?.email || "unknown",
      "Usunięcie wielu rekordów",
      `Usunięto ${ids.length} rekordów: ${names}`
    );

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania rekordów" },
      { status: 500 }
    );
  }
}
