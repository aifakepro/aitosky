import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import authConfig from './auth.config';
import fs from 'fs'; // Використовуємо звичайний fs для перевірки синхронно
import path from 'path';

export const { auth, handlers, signOut, signIn } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
  events: {
    async signIn({ user }) {
      if (user?.id) {
        // Оновлюємо час входу
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        // ПЕРЕВІРКА ТА СТВОРЕННЯ ФАЙЛУ
        const dirPath = path.join(process.cwd(), 'uploads-data');
        const filePath = path.join(dirPath, `${user.id}.json`);

        try {
          // Якщо папки немає — створюємо
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }

          // Якщо файлу немає — створюємо
          if (!fs.existsSync(filePath)) {
            const initialData = [
              { name: 'Jan', total: 100 },
              { name: 'Feb', total: 200 }
            ];
            fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
            console.log(`✅ Файл успішно створено: ${user.id}.json`);
          } else {
            console.log(`ℹ️ Файл уже існує для користувача: ${user.id}`);
          }
        } catch (error) {
          // Якщо це Edge runtime, fs видасть помилку. Ми її побачимо в консолі.
          console.error('⚠️ Помилка роботи з файловою системою:', error);
        }
      }
    }
  }
});
