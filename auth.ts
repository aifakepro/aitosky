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
          console.log(`🚀 Начинаем создание графиков для ${userId}`);

          // --- BarChart: 30 дней (НЕ ТРОГАЕМ) ---
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
          console.log('✅ BarChart успешно создан');

          // --- AreaChart: 6 месяцев ---
          const areaData = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date(today);
            d.setDate(1); // Фикс дублей
            d.setMonth(today.getMonth() + i);
            return {
              month: d.toISOString().slice(0, 7),
              desktop: 5,
              mobile: 5,
              userId
            };
          });

          console.log('📊 Подготовка AreaData:', areaData);

          // Пробуем создать
          await prisma.dashboardAreaChart.createMany({
            data: areaData,
            skipDuplicates: true
          });

          console.log('✅ AreaChart успешно создан');
        } catch (error) {
          // ЕСЛИ ДАННЫЕ НЕ СОЗДАЛИСЬ, ТЕКСТ ОШИБКИ БУДЕТ ТУТ:
          console.error('❌ КРИТИЧЕСКАЯ ОШИБКА ПРИ СОЗДАНИИ ГРАФИКОВ:', error);
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
