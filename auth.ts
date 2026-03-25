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

          // --- AreaChart: 6 месяцев ---
          const areaData = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date(today);
            d.setMonth(today.getMonth() - (5 - i)); // от 5 месяцев назад до текущего
            const month = d.toISOString().slice(0, 7); // "2025-10", "2025-11" ... "2026-03"
            return { month, desktop: 5, mobile: 1, userId };
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
