import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import authConfig from './auth.config';

export const { auth, handlers, signOut, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
  events: {
    async createUser({ user }) {
      if (!user?.id) return;

      const userId = user.id;
      const today = new Date();

      try {
        // 1. Генерация данных для BarChart (30 дней)
        const barData = Array.from({ length: 30 }).map((_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          return {
            date: d.toISOString().split('T')[0],
            desktop: 5,
            mobile: 5,
            userId
          };
        });

        // 2. Генерация данных для AreaChart (6 месяцев)
        const areaData = Array.from({ length: 6 }).map((_, i) => {
          const d = new Date(today);
          d.setDate(1); // Защита от ошибок при переходе месяцев (напр. с 31 числа)
          d.setMonth(today.getMonth() + i);
          return {
            month: d.toISOString().slice(0, 7),
            desktop: 5,
            mobile: 5,
            userId
          };
        });

        const pieData = [
          { browser: 'chrome', visitors: 275, userId },
          { browser: 'safari', visitors: 200, userId },
          { browser: 'firefox', visitors: 287, userId },
          { browser: 'edge', visitors: 173, userId },
          { browser: 'other', visitors: 190, userId }
        ];

        // 3. Атомарная запись в БД (все или ничего)
        await prisma.$transaction([
          prisma.dashboardBarChart.createMany({ data: barData }),
          prisma.dashboardAreaChart.createMany({
            data: areaData,
            skipDuplicates: true
          }),
          prisma.dashboardPieChart.createMany({
            data: pieData,
            skipDuplicates: true
          })
        ]);

        console.log(
          `✅ Данные графиков инициализированы для пользователя: ${userId}`
        );
      } catch (error) {
        console.error(
          '❌ Ошибка при инициализации данных пользователя:',
          error
        );
      }
    },

    async signIn({ user }) {
      if (user?.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
      }
    }
  }
});
