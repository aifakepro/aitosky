import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
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
}

export async function PATCH(req: Request) {
  try {
    const { taskId, newColumnId, newOrder } = await req.json();

    // 1. Сначала пересчитываем порядки в целевой колонке, чтобы освободить место
    // (все задачи, которые должны быть ниже новой позиции, сдвигаем вниз)
    await prisma.$transaction([
      prisma.task.updateMany({
        where: {
          columnId: newColumnId,
          order: { gte: Number(newOrder) },
          id: { not: taskId } // не трогаем саму задачу, если она уже там была
        },
        data: { order: { increment: 1 } }
      }),
      prisma.task.update({
        where: { id: taskId },
        data: {
          columnId: newColumnId,
          order: Number(newOrder)
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
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
