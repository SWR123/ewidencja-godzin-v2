import { prisma } from "./db";

export async function logActivity(
  userId: string,
  userName: string,
  userEmail: string,
  action: string,
  details?: string
) {
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

export function isAdminUser(email: string | null | undefined, role?: string): boolean {
  // Sprawdza po roli - SUPERVISOR lub ADMIN mają dostęp
  return role === 'SUPERVISOR' || role === 'ADMIN';
}
