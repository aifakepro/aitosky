import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Принудительно используем Node.js рантайм для работы с Prisma
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    console.log("Регистрация пользователя:", email);

    if (!email || !password) {
      return NextResponse.json({ message: "Заполните почту и пароль" }, { status: 400 });
    }

    // Проверяем, нет ли уже такого юзера
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Пользователь с таким email уже существует" }, { status: 400 });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
      },
    });

    // 2. ГЕНЕРАЦИЯ ГРАФИКОВ
    const userId = user.id;
    const today = new Date();

    const barData = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        desktop: 5,
        mobile: 5,
        userId
      };
    });

    const areaData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(1);
      d.setMonth(today.getMonth() + i);
      return {
        month: d.toISOString().slice(0, 7),
        desktop: 5,
        mobile: 5,
        userId
      };
    });

    const pieData = [
      { browser: 'chrome', visitors: 275, userId },
      { browser: 'safari', visitors: 200, userId },
      { browser: 'firefox', visitors: 287, userId },
      { browser: 'edge', visitors: 173, userId },
      { browser: 'other', visitors: 190, userId }
    ];

    // Выполняем запись данных напрямую без транзакции, чтобы избежать ошибок драйвера на Vercel
    await prisma.dashboardBarChart.createMany({ data: barData });
    await prisma.dashboardAreaChart.createMany({ data: areaData, skipDuplicates: true });
    await prisma.dashboardPieChart.createMany({ data: pieData, skipDuplicates: true });

    return NextResponse.json({ message: "Регистрация успешна" }, { status: 201 });

  } catch (error: any) {
    console.error("Ошибка при регистрации:", error);
    // Возвращаем текст ошибки, чтобы было понятно, почему 400 или 500
    return NextResponse.json({ message: error.message || "Ошибка сервера" }, { status: 500 });
  }
}