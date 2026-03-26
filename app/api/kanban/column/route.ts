import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { title, boardId } = await req.json();
    if (!boardId)
      return NextResponse.json({ error: 'No Board ID' }, { status: 400 });

    const column = await prisma.column.create({
      data: { title, boardId, order: 0 }
    });
    return NextResponse.json(column);
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('columnId');
  if (id) await prisma.column.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
