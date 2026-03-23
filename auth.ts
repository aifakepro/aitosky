import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import authConfig from './auth.config';
import fs from 'fs/promises';
import path from 'path';

export const { auth, handlers, signOut, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
  events: {
    // 1. Спрацьовує ПРИ РЕЄСТРАЦІЇ (перший вхід)
    async createUser({ user }) {
      if (user?.id) {
        try {
          const dirPath = path.join(process.cwd(), 'uploads-data');
          const filePath = path.join(dirPath, `${user.id}.json`);

          // Створюємо папку, якщо її немає
          await fs.mkdir(dirPath, { recursive: true });

          // Початкові дані для графіка (можна змінити на [] якщо треба порожній)
          const initialChartData = [
            { name: 'Jan', total: 0 },
            { name: 'Feb', total: 0 },
            { name: 'Mar', total: 0 }
          ];

          // Створюємо файл з ID користувача в назві
          await fs.writeFile(
            filePath,
            JSON.stringify(initialChartData, null, 2),
            'utf-8'
          );

          console.log(
            `📂 JSON файл створено для нового користувача: ${user.id}`
          );
        } catch (error) {
          console.error('❌ Помилка створення JSON файлу:', error);
        }
      }
    },

    // 2. Спрацьовує ПРИ КОЖНОМУ ВХОДІ (ви вже це мали)
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
