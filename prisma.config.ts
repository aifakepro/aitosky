import 'dotenv/config'; // ЦЕЙ РЯДОК ОБОВ'ЯЗКОВИЙ
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Тепер він побачить вашу змінну з файлу .env
    url: process.env.DATABASE_URL
  }
});
