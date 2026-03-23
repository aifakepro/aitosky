import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Генерує унікальні дати для юзера — рандомні дні в межах 2024 року
function generateDates(count: number): string[] {
  const dates = new Set<string>();
  const months = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12'
  ];

  while (dates.size < count) {
    const month = months[rand(0, months.length - 1)];
    const day = String(rand(1, 28)).padStart(2, '0'); // до 28 щоб уникнути невалідних дат
    dates.add(`2024-${month}-${day}`);
  }

  return Array.from(dates).sort();
}

function generateUserData(userId: string) {
  const dates = generateDates(20); // 20 унікальних дат для кожного юзера
  return dates.map((date) => ({
    date,
    desktop: rand(50, 500),
    mobile: rand(50, 450),
    userId
  }));
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  });

  if (!users.length) {
    console.log('❌ Немає юзерів в базі.');
    return;
  }

  console.log(`✅ Знайдено ${users.length} юзер(ів):`);

  for (const user of users) {
    // Видаляємо старі дані
    const deleted = await prisma.dashboardBarChart.deleteMany({
      where: { userId: user.id }
    });

    // Вставляємо нові — унікальні дати + значення для цього юзера
    const rows = generateUserData(user.id);
    await prisma.dashboardBarChart.createMany({ data: rows });

    console.log(`   ✅ ${user.email ?? user.id}`);
    console.log(`      видалено: ${deleted.count}, вставлено: ${rows.length}`);
    console.log(`      дати: ${rows.map((r) => r.date).join(', ')}`);
  }

  console.log(`\n🎉 Готово! Кожен юзер має унікальні дати і дані.`);
}

main()
  .catch((err) => {
    console.error('❌ Помилка:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
