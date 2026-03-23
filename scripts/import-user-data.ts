import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Папка з JSON файлами — кожен файл називається {userId}.json
const dataDir = path.resolve('./uploads-data');

async function main() {
  if (!fs.existsSync(dataDir)) {
    console.log(`❌ Папка ./data не існує. Створи її і поклади JSON файли.`);
    return;
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));

  if (!files.length) {
    console.log('❌ Немає JSON файлів в папці ./data');
    return;
  }

  console.log(`📂 Знайдено ${files.length} файл(ів)\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const userId = path.basename(file, '.json');
    const filePath = path.join(dataDir, file);

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      if (!Array.isArray(data)) {
        console.log(`⚠️  ${file}: очікується масив — пропускаємо`);
        failed++;
        continue;
      }

      // Перевіряємо чи існує юзер в базі
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        console.log(
          `⚠️  ${file}: юзер ${userId} не знайдений в базі — пропускаємо`
        );
        failed++;
        continue;
      }

      // Видаляємо старі дані і вставляємо нові
      const deleted = await prisma.dashboardBarChart.deleteMany({
        where: { userId }
      });

      await prisma.dashboardBarChart.createMany({
        data: data.map(
          (row: { date: string; desktop: number; mobile: number }) => ({
            date: row.date,
            desktop: row.desktop,
            mobile: row.mobile,
            userId
          })
        )
      });

      console.log(
        `✅ ${userId}: видалено ${deleted.count}, вставлено ${data.length} рядків`
      );
      success++;
    } catch (err) {
      console.log(`❌ ${file}: помилка — ${err}`);
      failed++;
    }
  }

  console.log(`\n🎉 Готово! Успішно: ${success}, помилок: ${failed}`);
}

main()
  .catch((err) => {
    console.error('❌ Критична помилка:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
