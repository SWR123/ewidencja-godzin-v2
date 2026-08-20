import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth-options";
import { prisma } from "../../../../../lib/db";
import { logActivity } from "../../../../../lib/activity-logger";

const SUPERVISOR_EMAIL = "brzezinscy@yahoo.pl";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only supervisor can update this flag
    if (session?.user?.email !== SUPERVISOR_EMAIL) {
      return NextResponse.json(
        { error: "Tylko supervisor może zarządzać resetem haseł" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requirePasswordReset } = body;

    if (typeof requirePasswordReset !== "boolean") {
      return NextResponse.json(
        { error: "requirePasswordReset must be a boolean" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params?.id },
      data: { requirePasswordReset },
    });

    // Log activity
    await logActivity(
      session.user?.id || "unknown",
      session.user?.name || "Nieznany",
      session.user?.email || "unknown",
      requirePasswordReset ? "Wymuszono reset hasła" : "Anulowano wymuszenie resetu hasła",
      `Użytkownik: ${updatedUser.name || ""} (${updatedUser.email || params?.id})`
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update password reset flag error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji flagi resetu hasła" },
      { status: 500 }
    );
  }
}
