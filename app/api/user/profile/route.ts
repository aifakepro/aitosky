import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id; // ← СОХРАНИТЕ В ПЕРЕМЕННУЮ

    const body = await req.json();
    const { firstname, lastname, email, contactno, country, city, jobs } = body;

    // Обновляем профиль
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstname,
        lastname,
        name: `${firstname} ${lastname}`,
        email,
        contactno,
        country,
        city
      }
    });

    // Удаляем старые jobs и создаём новые
    await prisma.job.deleteMany({
      where: { userId }
    });

    if (jobs && jobs.length > 0) {
      await prisma.job.createMany({
        data: jobs.map((job: any) => ({
          ...job,
          userId // ← ИСПОЛЬЗУЙТЕ ПЕРЕМЕННУЮ
        }))
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
