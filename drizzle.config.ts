import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './test/config/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:tmp.db',
  },
})
