import { defineConfig } from '@prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  database: {
    connectionUrl: process.env.DATABASE_URL,
  },
})
