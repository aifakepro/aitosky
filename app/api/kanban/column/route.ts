import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, boardId, order } = body;

    const column = await prisma.column.create({
      data: {
        title,
        boardId,
        order: order ?? 0
      }
    });

    return NextResponse.json(column);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create column' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('columnId');

  if (!id) return NextResponse.json({ error: 'No ID' }, { status: 400 });

  await prisma.column.delete({
    where: { id }
  });

  return NextResponse.json({ success: true });
}
