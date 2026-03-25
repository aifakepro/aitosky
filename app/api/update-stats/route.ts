import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, barData, areaData, apiKey } = body;

    // 1. Проверка API ключа
    if (apiKey !== process.env.MY_SECRET_SERVER_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Проверка наличия данных
    if (!userId || !barData || !areaData) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // 3. Выполняем полное обновление в одной транзакции
    await prisma.$transaction(async (tx) => {
      // --- Обновляем BarChart ---
      await tx.dashboardBarChart.deleteMany({ where: { userId } });
      await tx.dashboardBarChart.createMany({
        data: barData.map((item: any) => ({
          date: item.date,
          desktop: item.desktop,
          mobile: item.mobile,
          userId
        }))
      });

      // --- Обновляем AreaChart ---
      await tx.dashboardAreaChart.deleteMany({ where: { userId } });
      await tx.dashboardAreaChart.createMany({
        data: areaData.map((item: any) => ({
          month: item.month, // напр. "2024-01"
          desktop: item.desktop,
          mobile: item.mobile,
          userId
        }))
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Dashboard data (Bar & Area) updated successfully'
    });
  } catch (e: any) {
    console.error('❌ Update Stats Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
