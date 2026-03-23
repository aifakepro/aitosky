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

          // Генеруємо масив на 30 днів
          const staticData = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return {
              date: d.toISOString().split('T')[0],
              desktop: 5, // СУВОРО 100
              mobile: 5, // СУВОРО 100
              userId: userId
            };
          });

          // Записуємо в Neon
          await prisma.dashboardBarChart.createMany({
            data: staticData
          });

          console.log(`✅ Створено чистий графік 100/100 для: ${userId}`);
        } catch (error) {
          console.error('❌ Помилка при створенні графіка:', error);
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
