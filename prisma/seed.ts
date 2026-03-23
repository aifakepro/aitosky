import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Читаємо JSON з папки uploads-data
async function getUserData(userId: string) {
  const filePath = path.join(process.cwd(), 'uploads-data', `${userId}.json`);

  try {
    const file = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(file);

    // Просто додаємо userId, не чіпаємо інші поля
    return data.map((item: any) => ({
      ...item,
      userId
    }));
  } catch {
    console.log(`⚠️ JSON не знайдено для userId: ${userId}`);
    return [];
  }
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  });

  if (!users.length) {
    console.log('❌ Немає юзерів в базі');
    return;
  }

  console.log(`✅ Знайдено ${users.length} юзер(ів)`);

  for (const user of users) {
    const deleted = await prisma.dashboardBarChart.deleteMany({
      where: { userId: user.id }
    });

    const rows = await getUserData(user.id);

    if (rows.length) {
      await prisma.dashboardBarChart.createMany({ data: rows });
    }

    console.log(`\n👤 ${user.email ?? user.id}`);
    console.log(`   видалено: ${deleted.count}`);
    console.log(`   вставлено: ${rows.length}`);
  }

  console.log('\n🎉 Готово: дані завантажені з JSON');
}

main()
  .catch((err) => {
    console.error('❌ Помилка:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
