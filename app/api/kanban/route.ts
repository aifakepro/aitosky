import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const revalidate = 0;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  let board = await prisma.board.findFirst({
    where: { userId: session.user.id },
    include: {
      columns: {
        orderBy: { order: 'asc' }, // Сортировка колонок
        include: {
          tasks: {
            orderBy: { order: 'asc' } // Сортировка задач внутри
          }
        }
      }
    }
  });

  if (!board) {
    try {
      board = await prisma.board.create({
        data: {
          title: 'Main Project',
          userId: session.user.id,
          columns: {
            create: [{ title: 'To Do', order: 0 }]
          }
        },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: { tasks: { orderBy: { order: 'asc' } } }
          }
        }
      });
    } catch (e) {
      board = await prisma.board.findFirst({
        where: { userId: session.user.id },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: { tasks: { orderBy: { order: 'asc' } } }
          }
        }
      });
    }
  }

  return NextResponse.json(board ? [board] : []);
}
