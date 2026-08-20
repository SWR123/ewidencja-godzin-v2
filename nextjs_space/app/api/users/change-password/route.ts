import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth-options";
import { prisma } from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { logActivity } from "../../../../lib/activity-logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPassword } = await req.json();

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Hasło musi mieć co najmniej 8 znaków" },
        { status: 400 }
      );
    }

    // Check for at least 1 uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Hasło musi zawierać co najmniej jedną wielką literę" },
        { status: 400 }
      );
    }

    // Check for at least 2 digits
    const digitMatches = newPassword.match(/\d/g);
    if (!digitMatches || digitMatches.length < 2) {
      return NextResponse.json(
        { error: "Hasło musi zawierać co najmniej dwie cyfry" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and reset flag
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        requirePasswordReset: false,
      },
    });

    // Log activity
    await logActivity(
      session.user.id,
      session.user.name || "Nieznany",
      session.user.email || "unknown",
      "Zmiana hasła",
      "Hasło zostało zmienione (wymuszona zmiana)"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zmiany hasła" },
      { status: 500 }
    );
  }
}
