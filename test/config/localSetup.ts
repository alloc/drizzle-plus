import { db } from './client'
import * as schema from './schema'

// Truncate all tables.
await Promise.all(
  Object.keys(schema).map(table => db.delete(schema[table as never]))
)
