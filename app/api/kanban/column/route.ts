import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { title, boardId } = await req.json();
    const count = await prisma.column.count({ where: { boardId } });
    const column = await prisma.column.create({
      data: { title, boardId, order: count }
    });
    return NextResponse.json(column);
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { columnId, title, order } = await req.json();
    const updated = await prisma.column.update({
      where: { id: columnId },
      data: {
        title: title !== undefined ? title : undefined,
        order: order !== undefined ? Number(order) : undefined
      }
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('columnId');
    if (id) await prisma.column.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}
