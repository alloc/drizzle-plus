import { operators, Placeholder, sql } from 'drizzle-orm'

declare module 'drizzle-orm' {
  // Add the operator to `db.query` at the type level.
  interface RelationFieldsFilterInternals<T> {
    foo?: T | Placeholder | undefined
  }
}

// Export the operator for RAW queries, since drizzle doesn't have a way to add
// the operator to RAW callbacks at the type level.
export const foo = (left: unknown, right: unknown) => {
  return sql`${left} <> ${right}`
}

// Inject the operator at runtime.
// @ts-ignore
operators.foo = foo
