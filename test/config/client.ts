import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import relations from './relations'
import * as schema from './schema'

export const db = drizzle({
  client: createClient({ url: 'file:tmp.db' }),
  schema,
  relations,
})

/** Truncate all tables or the specified tables. */
export async function truncate(keys?: (keyof typeof schema)[]) {
  await Promise.all(
    (keys ?? Object.keys(schema)).map(table =>
      db.delete(schema[table as never])
    )
  )
}
