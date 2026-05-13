import { prisma } from "../lib/db";

const ADMIN_EMAIL = "admin@ewidencja.pl";

export async function logActivity(
  userId: string,
  userName: string,
  userEmail: string,
  action: string,
  details?: string
) {
  // Don't log activities for the admin user
  if (userEmail === ADMIN_EMAIL) {
    return;
  }

  try {
    await prisma.activityLog.create({
      data: {
        userId,
        userName,
        userEmail,
        action,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export function isAdminUser(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}
