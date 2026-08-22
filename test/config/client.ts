import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import relations from './relations'

export const db = drizzle({
  client: createClient({ url: 'file:tmp.db' }),
  relations,
})
