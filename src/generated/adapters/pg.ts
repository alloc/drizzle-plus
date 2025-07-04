import { SQL } from 'drizzle-orm'
import { PgSession } from 'drizzle-orm/pg-core'

export function execute<T>(session: PgSession, query: SQL) {
  return session.execute<T>(query)
}
