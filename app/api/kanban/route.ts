import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  // Проверяем, есть ли уже доска
  let board = await prisma.board.findFirst({
    where: { userId: session.user.id },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } }
      }
    }
  });

  // Если доски нет — создаем её ОДНУ
  if (!board) {
    try {
      board = await prisma.board.create({
        data: {
          title: 'Main Project',
          userId: session.user.id,
          columns: {
            // ОСТАВЛЯЕМ ТОЛЬКО ОДИН ОБЪЕКТ В МАССИВЕ
            create: [{ title: 'To Do', order: 0 }]
          }
        },
        include: { columns: { include: { tasks: true } } }
      });
    } catch (e) {
      board = await prisma.board.findFirst({
        where: { userId: session.user.id },
        include: { columns: { include: { tasks: true } } }
      });
    }
  }

  return NextResponse.json([board]);
}
