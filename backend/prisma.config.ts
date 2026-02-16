import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma 7: connection URL lives here, not in schema. Use process.env so
// prisma generate during build works when DATABASE_URL is not set yet.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
