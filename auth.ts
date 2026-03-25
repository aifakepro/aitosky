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
      if (user?.id) {
        try {
          const userId = user.id;
          const today = new Date();

          // --- BarChart: 30 дней (Оставляем как есть, тут обычно нет проблем) ---
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
          await prisma.dashboardBarChart.createMany({ data: barData });

          // --- AreaChart: 6 месяцев (ИСПРАВЛЕННЫЙ БЛОК) ---
          const areaData = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date(today);
            // ФИКС: Сначала ставим 1-е число, чтобы не перепрыгнуть через месяц
            // если сегодня 31-е (например, 31 марта + 1 месяц = 1 мая, и апрель пролетает)
            d.setDate(1);
            d.setMonth(today.getMonth() + i);

            const month = d.toISOString().slice(0, 7); // "2024-01"
            return { month, desktop: 5, mobile: 5, userId };
          });

          // Используем skipDuplicates: true, чтобы если вдруг месяц повторится,
          // скрипт не падал, а просто пропускал дубликат
          await prisma.dashboardAreaChart.createMany({
            data: areaData,
            skipDuplicates: true
          });

          console.log(`✅ Все графики созданы для: ${userId}`);
        } catch (error) {
          // Если будет ошибка, ты увидишь её в консоли терминала
          console.error('❌ Ошибка при создании графиков:', error);
        }
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
