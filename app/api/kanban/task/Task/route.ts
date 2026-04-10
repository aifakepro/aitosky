import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Проверка: получили ли мы columnId?
    if (!body.columnId) {
      return NextResponse.json(
        { error: 'columnId is required' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || '',
        columnId: body.columnId,
        order: body.order ?? 0
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('PRISMA_TASK_ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { taskId, newColumnId, newOrder } = body;

    // Указываем тип tx: Prisma.TransactionClient
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to move task' }, { status: 500 });
  }
}
