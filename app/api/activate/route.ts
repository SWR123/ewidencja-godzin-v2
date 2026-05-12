import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse(
        generateHtmlResponse(false, "Brak tokenu aktywacyjnego."),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { activationToken: token },
    });

    if (!user) {
      return new NextResponse(
        generateHtmlResponse(false, "Nieprawidłowy token aktywacyjny."),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    if (user.isActive) {
      return new NextResponse(
        generateHtmlResponse(true, `Konto użytkownika ${user.name || user.email} jest już aktywne.`),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        activationToken: null,
      },
    });

    return new NextResponse(
      generateHtmlResponse(true, `Konto użytkownika ${user.name || user.email} zostało pomyślnie aktywowane!`),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Activation error:", error);
    return new NextResponse(
      generateHtmlResponse(false, "Wystąpił błąd podczas aktywacji konta."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function generateHtmlResponse(success: boolean, message: string): string {
  const bgColor = success ? "#10b981" : "#ef4444";
  const icon = success ? "✓" : "✗";
  
  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktywacja konta - Ewidencja Godzin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${bgColor};
      color: white;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background: #4f46e5;
      color: white;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${success ? "Sukces!" : "Błąd"}</h1>
    <p>${message}</p>
    <a href="/logowanie" class="btn">Przejdź do logowania</a>
  </div>
</body>
</html>
  `;
}
