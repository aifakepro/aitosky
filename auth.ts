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
        const userId = user.id;

        try {
          // 1. ГЕНЕРУЄМО 30 ДНІВ ВІД СЬОГОДНІ
          const today = new Date();
          const dynamicData = Array.from({ length: 30 }).map((_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() + i); // додаємо по одному дню

            return {
              date: date.toISOString().split('T')[0], // Формат YYYY-MM-DD
              desktop: 100, // Всі дані по 100
              mobile: 100, // Всі дані по 100
              userId: userId
            };
          });

          // 2. ЗАПИСУЄМО В БАЗУ НЕОН
          await prisma.dashboardBarChart.createMany({
            data: dynamicData
          });

          console.log(
            `✅ Динамічний графік (30 днів, 100) створено для: ${userId}`
          );
        } catch (error) {
          console.error('❌ Помилка Prisma при створенні графіка:', error);
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
