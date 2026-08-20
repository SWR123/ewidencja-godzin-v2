import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { prisma } from "../../../../lib/db";
import { logActivity } from "../../../../lib/activity-logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const record = await prisma.record.findUnique({
      where: { id: params?.id },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Rekord nie znaleziony" },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Get record error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { timeEntries, ...rest } = body;

    // Calculate sum from time entries + starting hours
    let suma = 0;
    if (timeEntries && Array.isArray(timeEntries)) {
      suma = timeEntries.reduce(
        (total: number, entry: any) => total + (parseFloat(entry?.hours ?? 0) || 0),
        0
      );
    }
    // Add starting hours
    const startowaLiczbaGodzin = parseFloat(rest?.startowaLiczbaGodzin) || 0;
    suma += startowaLiczbaGodzin;

    const record = await prisma.record.update({
      where: { id: params?.id },
      data: {
        ...rest,
        timeEntries: timeEntries || [],
        suma,
      },
    });

    // Log activity
    await logActivity(
      session.user?.id || "unknown",
      session.user?.name || "Nieznany",
      session.user?.email || "unknown",
      "Edycja rekordu",
      `Rekord: ${rest.nazwisko} ${rest.imie}`
    );

    return NextResponse.json(record);
  } catch (error) {
    console.error("Update record error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji rekordu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get record data before deletion for logging
    const recordToDelete = await prisma.record.findUnique({
      where: { id: params?.id },
    });

    await prisma.record.delete({
      where: { id: params?.id },
    });

    // Log activity
    await logActivity(
      session.user?.id || "unknown",
      session.user?.name || "Nieznany",
      session.user?.email || "unknown",
      "Usunięcie rekordu",
      recordToDelete ? `Rekord: ${recordToDelete.nazwisko} ${recordToDelete.imie}` : `ID: ${params?.id}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete record error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania rekordu" },
      { status: 500 }
    );
  }
}
