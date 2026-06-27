// @ts-nocheck
import { getColumns } from 'drizzle-orm'
import { MySqlTable, TableConfig } from 'drizzle-orm/mysql-core'

declare module 'drizzle-orm/mysql-core' {
  interface MySqlTable<T extends TableConfig> {
    $without<TField extends keyof T['columns']>(
      ...fields: TField[]
    ): Omit<T['columns'], TField>
  }
}

MySqlTable.prototype.$without = function (...fields) {
  const columns = { ...getColumns(this) }
  for (const field of fields) {
    delete columns[field]
  }
  return columns
}
