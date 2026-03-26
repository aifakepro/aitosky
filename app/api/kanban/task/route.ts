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
      // 1. Сначала просто "перекидываем" нашу задачу в нужную колонку
      // Мы даем ей временный порядок -1, чтобы она не мешала при сортировке остальных
      await tx.task.update({
        where: { id: taskId },
        data: { columnId: newColumnId, order: -1 }
      });

      // 2. Получаем ВСЕ задачи этой колонки, отсортированные по текущему порядку
      const allTasks = await tx.task.findMany({
        where: { columnId: newColumnId },
        orderBy: { order: 'asc' }
      });

      // 3. Вынимаем нашу перемещенную задачу из списка
      const movedTask = allTasks.find((t) => t.id === taskId);
      const otherTasks = allTasks.filter((t) => t.id !== taskId);

      if (!movedTask) return;

      // 4. Вставляем её в массив строго на то место (индекс), которое пришло с фронта
      otherTasks.splice(newOrder, 0, movedTask);

      // 5. Теперь циклом перезаписываем всем задачам в колонке их реальные индексы 0, 1, 2, 3...
      // Это "выравнивает" нумерацию, даже если раньше там были дырки (типа 0, 2, 4)
      for (let i = 0; i < otherTasks.length; i++) {
        await tx.task.update({
          where: { id: otherTasks[i].id },
          data: { order: i }
        });
      }
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
    if (taskId) await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}
