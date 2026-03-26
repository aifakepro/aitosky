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
  try {
    const { taskId, newColumnId, newOrder } = await req.json();

    await prisma.$transaction(async (tx) => {
      // 1. Получаем задачу, которую двигаем
      const movingTask = await tx.task.findUnique({ where: { id: taskId } });
      if (!movingTask) return;

      // 2. Сдвигаем все ОСТАЛЬНЫЕ задачи в целевой колонке,
      // чтобы освободить место для нашей задачи
      await tx.task.updateMany({
        where: {
          columnId: newColumnId,
          order: { gte: newOrder }
        },
        data: { order: { increment: 1 } }
      });

      // 3. Ставим нашу задачу на её новое место
      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: newColumnId,
          order: newOrder
        }
      });

      // 4. (Опционально) "Схлопываем" дырку в старой колонке, откуда ушла задача
      await tx.task.updateMany({
        where: {
          columnId: movingTask.columnId,
          order: { gt: movingTask.order }
        },
        data: { order: { decrement: 1 } }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    if (!taskId)
      return NextResponse.json({ error: 'taskId required' }, { status: 400 });

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}
