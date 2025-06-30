import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import relations from './relations'
import * as schema from './schema'

export const db = drizzle({
  client: createClient({ url: 'file:tmp.db' }),
  schema,
  relations,
})
