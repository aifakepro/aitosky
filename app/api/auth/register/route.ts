import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Email already in use' },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, password: hashed }
  });

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

  await prisma.$transaction([
    prisma.dashboardBarChart.createMany({ data: barData }),
    prisma.dashboardAreaChart.createMany({
      data: areaData,
      skipDuplicates: true
    }),
    prisma.dashboardPieChart.createMany({ data: pieData, skipDuplicates: true })
  ]);

  return NextResponse.json({ id: user.id, email: user.email });
}
