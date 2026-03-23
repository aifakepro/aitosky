// app/api/update-stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, newData, apiKey } = body;

    // Перевірка секретного ключа (щоб тільки ваш сервер міг це робити)
    if (apiKey !== process.env.MY_SECRET_SERVER_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.$transaction(async (tx) => {
      // Видаляємо старі дані (ті, що створив auth.ts або попередній апдейт)
      await tx.dashboardBarChart.deleteMany({ where: { userId } });

      // Записуємо нові реальні дані
      await tx.dashboardBarChart.createMany({
        data: newData.map((item: any) => ({
          ...item,
          userId
        }))
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Data updated in Neon'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
