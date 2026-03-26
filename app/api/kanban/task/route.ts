import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || '',
        columnId: body.columnId,
        order: Number(body.order) ?? 0
      }
    });
    return NextResponse.json(task);
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { taskId, newColumnId, newOrder } = await req.json();

    await prisma.$transaction(async (tx) => {
      // 1. Сначала сдвигаем задачи в новой колонке вниз
      await tx.task.updateMany({
        where: {
          columnId: newColumnId,
          order: { gte: Number(newOrder) }
        },
        data: { order: { increment: 1 } }
      });

      // 2. Ставим нашу задачу на её место
      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: newColumnId,
          order: Number(newOrder)
        }
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
    if (!taskId) return NextResponse.json({ error: 'No ID' }, { status: 400 });
    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}
