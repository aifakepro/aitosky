import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  // Ищем только ОДНУ первую доску пользователя
  let board = await prisma.board.findFirst({
    where: { userId: session.user.id },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } }
      }
    }
  });

  // Если доски нет — создаем её ОДИН раз
  if (!board) {
    board = await prisma.board.create({
      data: {
        title: 'Main Board',
        userId: session.user.id,
        columns: {
          create: [
            { title: 'To Do', order: 0 },
            { title: 'In Progress', order: 1 }
          ]
        }
      },
      include: { columns: { include: { tasks: true } } }
    });
  }

  return NextResponse.json([board]); // Возвращаем массив с одной доской
}
