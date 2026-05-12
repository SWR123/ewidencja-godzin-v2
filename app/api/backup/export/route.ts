import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await prisma.record.findMany({
      orderBy: { createdAt: "desc" },
    });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const backupData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      records,
      users,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const date = new Date().toISOString().split("T")[0];
    const filename = `backup_ewidencja_${date}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backup export error:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia kopii zapasowej" },
      { status: 500 }
    );
  }
}
