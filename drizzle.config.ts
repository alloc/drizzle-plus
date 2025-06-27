import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './test/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:tmp.db',
  },
})
