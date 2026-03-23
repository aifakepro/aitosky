import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const chartData = [
  { date: '2024-04-01', desktop: 222, mobile: 150 },
  { date: '2024-04-02', desktop: 97, mobile: 180 },
  { date: '2024-04-03', desktop: 167, mobile: 120 },
  { date: '2024-04-04', desktop: 242, mobile: 260 },
  { date: '2024-04-05', desktop: 373, mobile: 290 },
  { date: '2024-04-06', desktop: 301, mobile: 340 },
  { date: '2024-04-07', desktop: 245, mobile: 180 },
  { date: '2024-04-08', desktop: 409, mobile: 320 },
  { date: '2024-04-09', desktop: 59, mobile: 110 },
  { date: '2024-04-10', desktop: 261, mobile: 190 },
  { date: '2024-05-01', desktop: 165, mobile: 220 },
  { date: '2024-05-02', desktop: 293, mobile: 310 },
  { date: '2024-05-03', desktop: 247, mobile: 190 },
  { date: '2024-05-04', desktop: 385, mobile: 420 },
  { date: '2024-05-05', desktop: 481, mobile: 390 },
  { date: '2024-06-01', desktop: 178, mobile: 200 },
  { date: '2024-06-02', desktop: 470, mobile: 410 },
  { date: '2024-06-03', desktop: 103, mobile: 160 },
  { date: '2024-06-04', desktop: 439, mobile: 380 },
  { date: '2024-06-05', desktop: 88, mobile: 140 }
];

async function main() {
  // 1. Отримуємо всіх юзерів
  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  });

  if (!users.length) {
    console.log('❌ Немає юзерів в базі. Спочатку створи хоча б одного.');
    return;
  }

  console.log(`✅ Знайдено ${users.length} юзер(ів):`);
  users.forEach((u) => console.log(`   - ${u.id} (${u.email ?? 'no email'})`));

  // 2. Для кожного юзера окремо — щоб уникнути дублів
  let totalInserted = 0;

  for (const user of users) {
    // Перевіряємо, чи вже є дані для цього юзера
    const existing = await prisma.dashboardBarChart.count({
      where: { userId: user.id }
    });

    if (existing > 0) {
      console.log(
        `⏭️  Юзер ${user.id} вже має ${existing} рядків — пропускаємо.`
      );
      continue;
    }

    const rows = chartData.map((row) => ({ ...row, userId: user.id }));

    await prisma.dashboardBarChart.createMany({ data: rows });

    console.log(`✅ Юзер ${user.id}: вставлено ${rows.length} рядків.`);
    totalInserted += rows.length;
  }

  console.log(
    `\n🎉 Seed завершено! Всього вставлено: ${totalInserted} рядків.`
  );
}

main()
  .catch((err) => {
    console.error('❌ Помилка під час seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
