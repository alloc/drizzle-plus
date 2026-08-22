import { isTable } from 'drizzle-orm'
import { db } from './client'
import * as schema from './schema'

// Truncate all tables.
await Promise.all(
  Object.values(schema)
    .filter(relation => isTable(relation))
    .map(table => db.delete(table))
)
