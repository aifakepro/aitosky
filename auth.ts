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
    // 1. Створюємо JSON файл ТІЛЬКИ при реєстрації нового користувача
    async createUser({ user }) {
      if (user?.id) {
        // Використовуємо точно такий самий шлях, як у вашому іншому файлі
        const filePath = path.join(
          process.cwd(),
          'uploads-data',
          `${user.id}.json`
        );

        try {
          // Записуємо порожній масив (або початкові дані), щоб скрипт міг його прочитати
          const initialData: any[] = [];
          await fs.writeFile(
            filePath,
            JSON.stringify(initialData, null, 2),
            'utf-8'
          );
          console.log(`✅ Файл створено: uploads-data/${user.id}.json`);
        } catch (error) {
          console.error('❌ Не вдалося створити файл при реєстрації:', error);
        }
      }
    },

    // 2. Ваша існуюча логіка оновлення часу входу
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
