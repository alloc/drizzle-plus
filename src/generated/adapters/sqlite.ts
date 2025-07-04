import { SQL } from 'drizzle-orm'
import { SQLiteSession } from 'drizzle-orm/sqlite-core'

export function execute(session: SQLiteSession<any, any>, query: SQL) {
  return session.all(query)
}
