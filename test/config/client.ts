import { createClient } from '@libsql/client'
import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

export const db = drizzle({
  client: createClient({ url: 'file:tmp.db' }),
  schema,
  relations: defineRelations(schema),
})
