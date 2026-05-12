import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backupData = await request.json();

    if (!backupData?.version || !backupData?.records) {
      return NextResponse.json(
        { error: "Nieprawidłowy format pliku kopii zapasowej" },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const record of backupData.records) {
      try {
        // Check if record with same data already exists
        const existingRecord = await prisma.record.findFirst({
          where: {
            nazwisko: record.nazwisko,
            imie: record.imie,
            kow: record.kow || null,
            wo: record.wo || null,
            ii_k: record.ii_k || null,
          },
        });

        if (existingRecord) {
          skippedCount++;
          continue;
        }

        // Create new record without the original id
        const { id, createdAt, updatedAt, ...recordData } = record;
        
        await prisma.record.create({
          data: {
            ...recordData,
            data1: recordData.data1 ? new Date(recordData.data1) : null,
            data2: recordData.data2 ? new Date(recordData.data2) : null,
          },
        });
        importedCount++;
      } catch (err) {
        console.error("Error importing record:", err);
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      message: `Zaimportowano ${importedCount} rekordów, pominięto ${skippedCount} (duplikaty lub błędy)`,
    });
  } catch (error) {
    console.error("Backup import error:", error);
    return NextResponse.json(
      { error: "Błąd podczas importowania kopii zapasowej" },
      { status: 500 }
    );
  }
}
