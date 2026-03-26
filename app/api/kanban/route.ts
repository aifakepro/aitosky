import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  let data = await prisma.board.findMany({
    where: { userId: session.user.id },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } }
      }
    }
  });

  // Если досок нет - создаем дефолтную, чтобы не было 404 в интерфейсе
  if (data.length === 0) {
    const defaultBoard = await prisma.board.create({
      data: {
        title: 'Main Project',
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
    return NextResponse.json([defaultBoard]);
  }

  return NextResponse.json(data);
}
