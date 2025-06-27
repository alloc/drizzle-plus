import { SQL, sql } from 'drizzle-orm'

export function literal<const T>(value: T): SQL<T> {
  const type = typeof value
  if (type === 'number' || type === 'boolean') {
    return sql.raw(String(value)) as SQL<T>
  }
  return sql<T>`${value}`
}
