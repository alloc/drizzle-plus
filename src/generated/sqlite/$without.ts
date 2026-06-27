// @ts-nocheck
import { getColumns } from 'drizzle-orm'
import { SQLiteTable, TableConfig } from 'drizzle-orm/sqlite-core'

declare module 'drizzle-orm/sqlite-core' {
  interface SQLiteTable<T extends TableConfig> {
    $without<TField extends keyof T['columns']>(
      ...fields: TField[]
    ): Omit<T['columns'], TField>
  }
}

SQLiteTable.prototype.$without = function (...fields) {
  const columns = { ...getColumns(this) }
  for (const field of fields) {
    delete columns[field]
  }
  return columns
}
