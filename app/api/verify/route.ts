import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/?error=invalid_link", req.url));
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!verificationToken || verificationToken.identifier !== email) {
    return NextResponse.redirect(new URL("/?error=invalid_token", req.url));
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(new URL("/?error=token_expired", req.url));
  }

  // Помечаем email как подтверждённый
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() }
  });

  // Удаляем использованный токен
  await prisma.verificationToken.delete({ where: { token } });

  // Редирект на страницу входа с успехом
  return NextResponse.redirect(new URL("/?verified=true", req.url));
}