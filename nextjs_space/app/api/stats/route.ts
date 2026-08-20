import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { prisma } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalRecords, totalUsers, recordsWithSum, recentRecords] =
      await Promise.all([
        prisma.record.count(),
        prisma.user.count(),
        prisma.record.findMany({
          select: { suma: true },
        }),
        prisma.record.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    const totalHours = recordsWithSum?.reduce?.(
      (sum: number, record: { suma: number | null }) => sum + (record?.suma ?? 0),
      0
    ) ?? 0;

    return NextResponse.json({
      totalRecords,
      totalUsers,
      totalHours: Math.round(totalHours * 10) / 10,
      recentRecords,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd" },
      { status: 500 }
    );
  }
}
