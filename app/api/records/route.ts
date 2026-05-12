import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived");

    const records = await prisma.record.findMany({
      where: {
        isArchived: archived === "true" ? true : false,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Get records error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const record = await prisma.record.create({
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
      "Utworzenie rekordu",
      `Rekord: ${rest.nazwisko} ${rest.imie}`
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Create record error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia rekordu" },
      { status: 500 }
    );
  }
}
