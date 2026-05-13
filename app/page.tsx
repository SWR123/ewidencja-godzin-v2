import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth-options";
import { prisma } from "../lib/db";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    // Check if user requires password reset directly from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { requirePasswordReset: true },
    });
    
    if (user?.requirePasswordReset) {
      redirect("/zmiana-hasla");
    }
    redirect("/strona-glowna");
  } else {
    redirect("/logowanie");
  }
}
