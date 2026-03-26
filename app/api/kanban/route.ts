import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  // Ищем доски пользователя
  let boards = await prisma.board.findMany({
    where: { userId: session.user.id },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } }
      }
    }
  });

  // Если досок нет - создаем ОДНУ (используем upsert или простую проверку)
  if (boards.length === 0) {
    const defaultBoard = await prisma.board.create({
      data: {
        title: 'Main Board',
        userId: session.user.id,
        columns: {
          create: [
            { title: 'Todo', order: 0 },
            { title: 'In Progress', order: 1 }
          ]
        }
      },
      include: { columns: { include: { tasks: true } } }
    });
    return NextResponse.json([defaultBoard]);
  }

  return NextResponse.json(boards);
}

// Для изменения названия доски
export async function PATCH(req: Request) {
  const body = await req.json();
  const { boardId, title } = body;

  const updatedBoard = await prisma.board.update({
    where: { id: boardId },
    data: { title }
  });

  return NextResponse.json(updatedBoard);
}
