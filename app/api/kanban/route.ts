import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const data = await prisma.board.findMany({
    include: {
      columns: {
        include: {
          tasks: true
        }
      }
    }
  });

  return NextResponse.json(data);
}
