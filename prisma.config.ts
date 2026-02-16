import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // ← ЕДИНСТВЕННОЕ ЧИСЛО (ошибка показывает что нужно datasource)
    url: process.env.DATABASE_URL
  }
});
