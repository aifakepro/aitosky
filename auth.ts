import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import authConfig from './auth.config';

export const { auth, handlers, signOut, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
  events: {
    // Спрацьовує ТІЛЬКИ ОДИН РАЗ при реєстрації
    async createUser({ user }) {
      if (user?.id) {
        try {
          const userId = user.id;
          const today = new Date();

          // --- BarChart: 30 дней ---
          const barData = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i)); // От 29 дней назад до сегодня

            return {
              date: d.toISOString().split('T')[0],
              desktop: Math.floor(Math.random() * 50) + 5,
              mobile: Math.floor(Math.random() * 50) + 5,
              userId
            };
          });
          await prisma.dashboardBarChart.createMany({ data: barData });

          // --- AreaChart: 6 месяцев ---
          const areaData = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setDate(1); // Избегаем проблем с 31-м числом
            d.setMonth(d.getMonth() - (5 - i)); // Создаем данные за последние 5 месяцев + текущий

            const month = d.toISOString().slice(0, 7); // "2024-01"
            return {
              month,
              desktop: Math.floor(Math.random() * 100) + 10, // Рандомные данные выглядят лучше
              mobile: Math.floor(Math.random() * 100) + 10,
              userId
            };
          });
          await prisma.dashboardAreaChart.createMany({ data: areaData });

          console.log(`✅ Графики созданы для: ${userId}`);
        } catch (error) {
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
