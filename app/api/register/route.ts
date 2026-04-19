import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    // 1. Правильный парсинг JSON в Next.js
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Enter your email and password" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "This email is already linked to Google/GitHub-sign in through them" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
      },
    });

    console.log("✅ User created:", user.id);

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 часа

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    });

    const verifyUrl = `${process.env.NEXTAUTH_URL ?? 'https://aitosky.vercel.app'}/api/verify?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: 'Confirm your email — AiToSky',
      html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Welcome to AiToSky!</h2>
      <p>Click the button below to confirm your email:</p>
      <a href="${verifyUrl}" style="
        display: inline-block;
        padding: 12px 24px;
        background: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
      ">Confirm email</a>
      <p style="color: #888; font-size: 13px;">
        Link expires in 24 hours.
      </p>
    </div>
  `
    });

    // 3. ВАЖНО: Генерируем графики прямо здесь! 
    // Потому что NextAuth event.createUser НЕ срабатывает при регистрации по паролю.
    const today = new Date();
    const barData = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        desktop: 5,
        mobile: 5,
        userId: user.id // используем id только что созданного юзера
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
        userId: user.id
      };
    });

    const pieData = [
      { browser: 'chrome', visitors: 275, userId: user.id },
      { browser: 'safari', visitors: 200, userId: user.id },
      { browser: 'firefox', visitors: 287, userId: user.id },
      { browser: 'edge', visitors: 173, userId: user.id },
      { browser: 'other', visitors: 190, userId: user.id }
    ];

    await prisma.$transaction([
      prisma.dashboardBarChart.createMany({ data: barData }),
      prisma.dashboardAreaChart.createMany({ data: areaData, skipDuplicates: true }),
      prisma.dashboardPieChart.createMany({ data: pieData, skipDuplicates: true })
    ]);
    console.log(`✅ Graph data has been initialized for the user: ${user.id}`);

    return NextResponse.json({ message: "Registration successful" }, { status: 201 });

  } catch (error) {
    const err = error as Error;
    console.error("💥 Error:", err.message);
    // Если ошибка связана с парсингом JSON от клиента
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: "Invalid data format from the client" }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}