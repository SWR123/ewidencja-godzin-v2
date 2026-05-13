import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { prisma } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Get current settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create global settings
    let settings = await prisma.settings.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "global",
          activeMonth: 1,
          activeYear: 2026,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { activeMonth, activeYear } = body;

    // Validate
    if (
      typeof activeMonth !== "number" ||
      activeMonth < 1 ||
      activeMonth > 12
    ) {
      return NextResponse.json(
        { error: "Nieprawidłowy miesiąc" },
        { status: 400 }
      );
    }

    if (
      typeof activeYear !== "number" ||
      activeYear < 2020 ||
      activeYear > 2100
    ) {
      return NextResponse.json({ error: "Nieprawidłowy rok" }, { status: 400 });
    }

    const settings = await prisma.settings.upsert({
      where: { id: "global" },
      update: {
        activeMonth,
        activeYear,
      },
      create: {
        id: "global",
        activeMonth,
        activeYear,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
