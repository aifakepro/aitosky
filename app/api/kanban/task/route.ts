import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { title, description, columnId } = await req.json();

    // Считаем задачи, чтобы дать следующий номер
    const count = await prisma.task.count({ where: { columnId } });

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        columnId,
        order: count
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
      // 1. Находим задачу, чтобы узнать её СТАРУЮ колонку
      const taskBeforeMove = await tx.task.findUnique({
        where: { id: taskId }
      });

      if (!taskBeforeMove) return;

      const sourceColumnId = taskBeforeMove.columnId;

      // 2. ВРЕМЕННО перемещаем задачу в новую колонку с порядком -1
      // (чтобы она не мешалась при пересчете других задач)
      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: newColumnId,
          order: -1
        }
      });

      // 3. НОРМАЛИЗАЦИЯ ЦЕЛЕВОЙ КОЛОНКИ (куда пришли)
      const targetTasks = await tx.task.findMany({
        where: { columnId: newColumnId },
        orderBy: { order: 'asc' }
      });

      const movedTask = targetTasks.find((t) => t.id === taskId);
      const otherTargetTasks = targetTasks.filter((t) => t.id !== taskId);

      if (movedTask) {
        // Вставляем нашу задачу в массив на нужное место
        otherTargetTasks.splice(newOrder, 0, movedTask);

        // Переписываем порядок всем в этой колонке: 0, 1, 2...
        for (let i = 0; i < otherTargetTasks.length; i++) {
          await tx.task.update({
            where: { id: otherTargetTasks[i].id },
            data: { order: i }
          });
        }
      }

      // 4. НОРМАЛИЗАЦИЯ ИСТОЧНИКА (откуда ушли)
      // Делаем это только если колонки РАЗНЫЕ
      if (sourceColumnId !== newColumnId) {
        const sourceTasks = await tx.task.findMany({
          where: { columnId: sourceColumnId },
          orderBy: { order: 'asc' }
        });

        // Просто переписываем им порядок 0, 1, 2..., чтобы закрыть дырку
        for (let i = 0; i < sourceTasks.length; i++) {
          await tx.task.update({
            where: { id: sourceTasks[i].id },
            data: { order: i }
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH_TASK_ERROR:', error);
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    if (taskId) await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}
