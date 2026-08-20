import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateActivationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function sendNewUserNotification(userName: string, userEmail: string, activationToken: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const activationLink = `${baseUrl}/api/activate?token=${activationToken}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
          Nowy użytkownik w systemie Ewidencji Godzin
        </h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Imię i nazwisko:</strong> ${userName}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
        </div>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 15px 0; font-weight: bold; color: #92400e;">⚠️ Użytkownik wymaga aktywacji</p>
          <p style="margin: 0 0 15px 0;">Kliknij poniższy przycisk, aby aktywować konto użytkownika:</p>
          <a href="${activationLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            ✓ Aktywuj konto
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">
          Data rejestracji: ${new Date().toLocaleString('pl-PL')}
        </p>
      </div>
    `;

    await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        subject: 'Nowy użytkownik w systemie Ewidencji Godzin',
        body: htmlBody,
        is_html: true,
        recipient_email: 'admin@ewidencja.pl',
        sender_alias: 'Ewidencja Godzin',
      }),
    });
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Użytkownik o tym adresie email już istnieje" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = generateActivationToken();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isActive: false,
        activationToken,
      },
    });

    // Send notification email about new user with activation link
    await sendNewUserNotification(name, email, activationToken);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: "Konto utworzone. Poczekaj na aktywację przez administratora.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas rejestracji" },
      { status: 500 }
    );
  }
}
