import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Создаем пользователя
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split('@')[0],
      },
    });

    // 2. ВСЁ! Никаких графиков, никаких транзакций. 
    // Если после этого придет 201 Created — значит, проблема была в данных графиков.
    return NextResponse.json({ message: "Успех" }, { status: 201 });

  } catch (error: any) {
    // ВАЖНО: возвращаем сообщение ошибки в ответе, чтобы увидеть его в Network
    return NextResponse.json({ message: error.toString() }, { status: 400 });
  }
}