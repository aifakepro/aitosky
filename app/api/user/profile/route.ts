import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // поправь путь если отличается
import { prisma } from '@/lib/db';
import { profileSchema } from '@/lib/form-schema';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { firstname, lastname, contactno, country, city, jobs } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { email: session.user!.email! },
      data: {
        firstname,
        lastname,
        contactno: String(contactno),
        country,
        city
        // email не трогаем — он ключ авторизации NextAuth
      }
    });

    // Пересоздаём jobs: удаляем старые, добавляем новые
    await tx.userJob.deleteMany({ where: { userId: user.id } });

    if (jobs.length > 0) {
      await tx.userJob.createMany({
        data: jobs.map((j) => ({ ...j, userId: user.id }))
      });
    }

    return tx.user.findUnique({
      where: { id: user.id },
      include: { jobs: true }
    });
  });

  return NextResponse.json(updated);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { jobs: true }
  });

  return NextResponse.json(user);
}
