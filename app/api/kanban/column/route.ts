import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  try {
    const { columnId, title, order } = await req.json();

    const updated = await prisma.column.update({
      where: { id: columnId },
      data: {
        title: title || undefined,
        order: order !== undefined ? Number(order) : undefined
      }
    });

    return NextResponse.json(updated);
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
