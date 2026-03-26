import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Обязательно добавь это, чтобы данные всегда были свежими
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { title, boardId } = await req.json();
    const column = await prisma.column.create({
      data: { title, boardId, order: 0 }
    });
    return NextResponse.json(column);
  } catch (e) {
    return NextResponse.json({ error: 'Fail' }, { status: 500 });
  }
}

// ЭТОГО МЕТОДА У ТЕБЯ НЕ БЫЛО — ОН НУЖЕН ДЛЯ ПЕРЕИМЕНОВАНИЯ
export async function PATCH(req: Request) {
  try {
    const { columnId, title } = await req.json();
    const updated = await prisma.column.update({
      where: { id: columnId },
      data: { title }
    });
    return NextResponse.json(updated);
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
