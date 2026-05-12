import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recordIds } = await request.json();

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json({ error: "No record IDs provided" }, { status: 400 });
    }

    const records = await prisma.record.findMany({
      where: { id: { in: recordIds } },
      orderBy: { nazwisko: "asc" },
    });

    // Przygotuj dane do arkusza
    const data = records.map((record: { nazwisko: string; imie: string; miesieczny_wymiar_godzin: number | null; ilosc_miesiecy: number | null; suma: number | null; kow: string | null }) => {
      // Oblicz sumę wyroku (miesieczny_wymiar_godzin * ilosc_miesiecy)
      const sumaWyroku = (record.miesieczny_wymiar_godzin || 0) * (record.ilosc_miesiecy || 0);
      
      return {
        "Nazwisko": record.nazwisko || "",
        "Imię": record.imie || "",
        "Kow": record.kow || "",
        "Suma godzin": record.suma || 0,
        "Suma wyroku": sumaWyroku,
      };
    });

    // Utwórz workbook i worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Zestawienie");

    // Ustaw szerokości kolumn
    worksheet["!cols"] = [
      { wch: 20 }, // Nazwisko
      { wch: 15 }, // Imię
      { wch: 15 }, // Kow
      { wch: 12 }, // Suma godzin
      { wch: 12 }, // Suma wyroku
    ];

    // Generuj bufor XLSX
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Loguj akcję
    const recordNames = records.map((r: { nazwisko: string; imie: string }) => `${r.nazwisko} ${r.imie}`).join(", ");
    await logActivity(
      session.user?.id || "",
      session.user?.name || "Nieznany",
      session.user?.email || "",
      "Generowanie zestawienia XLSX",
      `Wygenerowano zestawienie dla ${records.length} rekordów: ${recordNames}`
    );

    // Zwróć plik XLSX
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="zestawienie_${new Date().getTime()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Generate XLSX error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
