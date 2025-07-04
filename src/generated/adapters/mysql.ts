import { SQL } from 'drizzle-orm'
import { MySqlSession } from 'drizzle-orm/mysql-core'

export function execute<T>(session: MySqlSession, query: SQL) {
  return session.execute<T>(query)
}
