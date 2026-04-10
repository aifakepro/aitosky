import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Принудительно используем Node.js рантайм для работы с Prisma
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("DEBUG: Получен запрос, тело:", body);

    const { email, password, name } = body;

    if (!email || !password) {
      console.log("DEBUG: Ошибка - нет email или пароля");
      return NextResponse.json({ message: "Заполните почту и пароль" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log("DEBUG: Ошибка - юзер уже есть");
      return NextResponse.json({ message: "Пользователь уже существует" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("DEBUG: Пароль захэширован, создаем юзера...");

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
        userId,
        updatedAt: new Date() // <--- ЭТО РЕШИТ ПРОБЛЕМУ
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
    console.error("DEBUG: КРИТИЧЕСКАЯ ОШИБКА:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}