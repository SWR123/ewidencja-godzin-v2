import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";

const ADMIN_EMAIL = "admin@ewidencja.pl";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can delete users
    if (session?.user?.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Tylko administrator może usuwać użytkowników" },
        { status: 403 }
      );
    }

    // Prevent deleting yourself
    if (session?.user?.id === params?.id) {
      return NextResponse.json(
        { error: "Nie możesz usunąć własnego konta" },
        { status: 400 }
      );
    }

    // Get user data before deletion for logging
    const userToDelete = await prisma.user.findUnique({
      where: { id: params?.id },
    });

    await prisma.user.delete({
      where: { id: params?.id },
    });

    // Log activity
    await logActivity(
      session.user?.id || "unknown",
      session.user?.name || "Nieznany",
      session.user?.email || "unknown",
      "Usunięcie użytkownika",
      `Użytkownik: ${userToDelete?.name || ""} (${userToDelete?.email || params?.id})`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania użytkownika" },
      { status: 500 }
    );
  }
}
