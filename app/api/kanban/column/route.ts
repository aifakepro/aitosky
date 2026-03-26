import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { title, boardId } = await req.json();

    // 1. Считаем колонки, чтобы дать новый order
    const count = await prisma.column.count({ where: { boardId } });

    const column = await prisma.column.create({
      data: {
        title,
        boardId,
        order: count // Теперь первая будет 0, вторая 1 и т.д.
      }
    });
    return NextResponse.json(column);
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { columnId, title, order } = await req.json();

    // Если пришел order — значит мы перетащили колонку
    // Если пришел title — значит мы ее переименовали
    const updated = await prisma.column.update({
      where: { id: columnId },
      data: {
        title: title !== undefined ? title : undefined,
        order: order !== undefined ? order : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}
