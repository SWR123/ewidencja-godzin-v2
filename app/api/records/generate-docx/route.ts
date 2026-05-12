import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  AlignmentType, 
  WidthType, 
  BorderStyle,
  convertInchesToTwip,
  TabStopPosition,
  TabStopType
} from "docx";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export const dynamic = "force-dynamic";

function getMonthName(date: Date): string {
  const months = [
    "styczniu", "lutym", "marcu", "kwietniu", "maju", "czerwcu",
    "lipcu", "sierpniu", "wrześniu", "październiku", "listopadzie", "grudniu"
  ];
  return months[date.getMonth()];
}

function getMonthNameNominative(date: Date): string {
  const months = [
    "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
    "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"
  ];
  return months[date.getMonth()];
}

// Helper function to format date for Polish timezone (UTC+1/+2)
// Dates are stored as UTC but represent Polish local dates (e.g. "2026-01-22T23:00:00.000Z" = 23 Jan in Poland)
function formatDateSafe(dateValue: any): string {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    
    // Add 2 hours to handle Polish timezone (UTC+1 winter, UTC+2 summer)
    // This ensures "2026-01-22T23:00:00.000Z" becomes "23.01.2026" (correct Polish date)
    const polishDate = new Date(d.getTime() + 2 * 60 * 60 * 1000);
    
    const day = String(polishDate.getUTCDate()).padStart(2, "0");
    const month = String(polishDate.getUTCMonth() + 1).padStart(2, "0");
    const year = polishDate.getUTCFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return "";
  }
}

function getMonthNameByNumber(monthNum: number): string {
  const months = [
    "styczniu", "lutym", "marcu", "kwietniu", "maju", "czerwcu",
    "lipcu", "sierpniu", "wrześniu", "październiku", "listopadzie", "grudniu"
  ];
  return months[monthNum - 1] || months[0];
}

function createSectionForRecord(record: any, userName: string) {
  const timeEntries = record?.timeEntries as any[] || [];
  const currentDate = new Date();
  const spaces = "                                                                                                   ";
  
  const children: (Paragraph | Table)[] = [];
  
  // Header - centered organization info
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Ośrodek Sportu i Rekreacji w Brodnicy", bold: true, size: 22 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: "87-300 BRODNICA, ul. Królowej Jadwigi 1", size: 20 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: "tel. 056/ 491 34 40, fax 056/ 491 34 41", size: 20 })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: "NIP 874-10-40-451", size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({ text: "" })
  );

  // Case references on left + Court address on right
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Kow ${record?.kow || ""}`, size: 20 })],
    }),
    new Paragraph({ text: " " }),
    new Paragraph({
      children: [
        new TextRun({ text: `Wo ${record?.wo || ""}`, size: 20 }),
        new TextRun({ text: spaces + "Sąd Rejonowy", size: 20 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: spaces + "Zespół Kuratorskiej Służby Sądowej", size: 20 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `II K ${record?.ii_k || ""}`, size: 20 }),
        new TextRun({ text: "                                                                       wykonujący orzeczenia w sprawach karnych", size: 20 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: spaces + "ul. Sądowa  5", size: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: spaces + "87-300  BRODNICA", size: 20 })],
      spacing: { after: 300 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" })
  );

  // Organization name in middle
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "                           OŚRODEK SPORTU i REKREACJI  w  BRODNICY, ul. Królowej Jadwigi 1", size: 20 })],
      spacing: { after: 200 },
    }),
    new Paragraph({ text: "" })
  );

  // Main text with person info
  const adres = `${record?.kod || ""} ${record?.miejscowosc || ""} ${record?.ulica || ""} ${record?.nr_domu || ""}${record?.nr_lokalu ? "/" + record.nr_lokalu : ""}`;
  
  // Use record's own month/year if available, otherwise fallback to record data
  let month: string;
  let year: number;
  
  if (record?.recordMonth && record?.recordYear) {
    month = getMonthNameByNumber(record.recordMonth);
    year = record.recordYear;
  } else if (record?.data1) {
    const d1 = new Date(record.data1);
    month = getMonthName(d1);
    year = d1.getUTCFullYear();
  } else if (timeEntries.length > 0 && timeEntries[0]?.date) {
    const entryDate = new Date(timeEntries[0].date);
    month = getMonthName(entryDate);
    year = entryDate.getUTCFullYear();
  } else {
    month = getMonthName(currentDate);
    year = currentDate.getFullYear();
  }
  
  // Calculate sum for selected month only
  const monthSum = timeEntries
    .filter(entry => {
      if (!entry?.date) return false;
      const entryDate = new Date(entry.date);
      const polishDate = new Date(entryDate.getTime() + 2 * 60 * 60 * 1000);
      const entryMonth = polishDate.getUTCMonth() + 1;
      const entryYear = polishDate.getUTCFullYear();
      if (record?.recordMonth && record?.recordYear) {
        return entryMonth === record.recordMonth && entryYear === record.recordYear;
      }
      return true;
    })
    .reduce((sum, entry) => sum + (parseFloat(entry?.hours) || 0), 0);

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Informuję, że skazana/y ukarana/y ", size: 20 }),
        new TextRun({ text: `${record?.nazwisko || ""} ${record?.imie || ""}`, bold: true, size: 20 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Zamieszkała/y ", size: 20 }),
        new TextRun({ text: adres, bold: true, size: 20 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: `wykonał  w   ${month}   ${year}  r.`, size: 20 })],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${monthSum}`, bold: true, size: 20 }),
        new TextRun({ text: " godzin nieodpłatnej kontrolowanej pracy na cele społeczne w ramach kary", size: 20 }),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "orzeczonej w przedmiotowej sprawie.", size: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "Skazana/y ukarana/y  wykonywał/a wskazane prace zgodnie z ustalonym harmonogramem/", size: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "niezgodnie z ustalonym harmonogramem.", size: 20 })],
      spacing: { after: 200 },
    }),
    new Paragraph({ text: "" })
  );

  // Time tracking table
  const tableRows: TableRow[] = [];
  
  // Header row
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Data", bold: true, size: 20 })],
            alignment: AlignmentType.CENTER 
          })],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "Liczba  godzin", bold: true, size: 20 })],
            alignment: AlignmentType.CENTER 
          })],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    })
  );

  // Data rows - filter entries for selected month only
  const validEntries = timeEntries.filter(entry => {
    if (!entry?.date) return false;
    const entryDate = new Date(entry.date);
    // Add timezone offset like in formatDateSafe
    const polishDate = new Date(entryDate.getTime() + 2 * 60 * 60 * 1000);
    const entryMonth = polishDate.getUTCMonth() + 1;
    const entryYear = polishDate.getUTCFullYear();
    
    // Filter by record's selected month/year
    if (record?.recordMonth && record?.recordYear) {
      return entryMonth === record.recordMonth && entryYear === record.recordYear;
    }
    return true; // If no month selected, show all
  });
  for (const entry of validEntries) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ 
                text: formatDateSafe(entry?.date), 
                size: 20 
              })],
              alignment: AlignmentType.CENTER,
            })],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ 
                text: entry?.hours?.toString() || "", 
                size: 20 
              })],
              alignment: AlignmentType.CENTER,
            })],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      })
    );
  }

  // SUMA row - calculate sum from filtered entries
  const tableSuma = validEntries.reduce((sum, entry) => sum + (parseFloat(entry?.hours) || 0), 0);
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: "SUMA", bold: true, size: 20 })],
            alignment: AlignmentType.CENTER 
          })],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: tableSuma.toString(), bold: true, size: 20 })],
            alignment: AlignmentType.CENTER 
          })],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    })
  );

  const table = new Table({
    rows: tableRows,
    width: { size: 50, type: WidthType.PERCENTAGE },
  });

  children.push(table);

  // Comments section - after table
  children.push(
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [new TextRun({ text: "Ocena wykonywanej pracy i postawy skazanej/go ukaranej/go ewentualne uwagi:", size: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "/rodzaj wykonywanej pracy ,nie zgłoszenie się do pracy w wyznaczonym terminie,", size: 18, italics: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "Nie podjęcie przydzielonej pracy, opuszczenie pracy bez uzasadnienia, inne przypadki rażącego lub uporczywego nieprzestrzegania porządku i dyscypliny pracy/", size: 18, italics: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: record?.uwagi || "", size: 20 })],
      spacing: { after: 100 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({ text: "Dzień przystąpienia do wykonywania prac ", size: 20 }),
        new TextRun({ text: formatDateSafe(record?.data1), bold: true, size: 20 }),
        new TextRun({ text: "¹", size: 16, superScript: true }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Dzień  zakończenia wykonywania prac ", size: 20 }),
        new TextRun({ text: formatDateSafe(record?.data2), bold: true, size: 20 }),
        new TextRun({ text: "²", size: 16, superScript: true }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [new TextRun({ text: "¹ wypełnić w przypadku zaświadczenia za pierwszy m-c wyk. prac", size: 16, italics: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "² wypełnić w przypadku zaświadczenia za ostatni miesiąc", size: 16, italics: true })],
      spacing: { after: 200 },
    })
  );

  // Footer with date
  const footerDate = `${currentDate.getDate()} ${getMonthNameNominative(currentDate)} ${currentDate.getFullYear()}`;
  children.push(
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [new TextRun({ text: `BRODNICA,  dnia ${footerDate} r.`, size: 20 })],
      alignment: AlignmentType.RIGHT,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [new TextRun({ text: `utworzył: ${userName}`, size: 18 })],
      alignment: AlignmentType.LEFT,
    })
  );

  return { children };
}

function createDocumentForRecords(records: any[], userName: string) {
  const sections = records.map((record) => createSectionForRecord(record, userName));
  
  const doc = new Document({
    sections: sections,
  });

  return doc;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recordIds } = body;

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { error: "Brak identyfikatorów rekordów" },
        { status: 400 }
      );
    }

    // Fetch records
    const records = await prisma.record.findMany({
      where: {
        id: {
          in: recordIds,
        },
      },
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: "Nie znaleziono rekordów" },
        { status: 404 }
      );
    }

    // Helper function to sanitize filename (remove Polish characters)
    const sanitizeFilename = (str: string) => {
      const polishChars: { [key: string]: string } = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
        'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
        'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
      };
      return str.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => polishChars[char] || char);
    };

    // Generate document with all records (each record = separate page/section)
    const userName = session.user?.name || session.user?.email || "nieznany";
    const doc = createDocumentForRecords(records, userName);
    const buffer = await Packer.toBuffer(doc);
    
    let filename: string;
    if (records.length === 1) {
      filename = sanitizeFilename(`ewidencja_${records[0]?.nazwisko || 'rekord'}_${records[0]?.imie || ''}.docx`);
    } else {
      filename = `ewidencja_${records.length}_rekordow.docx`;
    }

    // Log activity
    const names = records.map((r: any) => `${r.nazwisko} ${r.imie}`).join(", ");
    await logActivity(
      session.user?.id || "unknown",
      session.user?.name || "Nieznany",
      session.user?.email || "unknown",
      "Generowanie dokumentu",
      `Wygenerowano dla: ${names}`
    );

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Generate DOCX error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas generowania dokumentu" },
      { status: 500 }
    );
  }
}
