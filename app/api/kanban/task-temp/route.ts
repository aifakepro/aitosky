import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      columnId: body.columnId,
      order: body.order ?? 0
    }
  });

  return NextResponse.json(task);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { taskId, newColumnId, newOrder } = body;

  await prisma.$transaction(async (tx) => {
    // Сдвигаем все задачи в целевой колонке вниз начиная с newOrder
    await tx.task.updateMany({
      where: {
        columnId: newColumnId,
        order: { gte: newOrder },
        id: { not: taskId }
      },
      data: { order: { increment: 1 } }
    });

    await tx.task.update({
      where: { id: taskId },
      data: { columnId: newColumnId, order: newOrder }
    });
  });

  return NextResponse.json({ success: true });
}
