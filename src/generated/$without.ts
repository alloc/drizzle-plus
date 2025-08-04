import { PgTable, TableConfig } from 'drizzle-orm/pg-core'

declare module 'drizzle-orm/pg-core' {
  interface PgTable<T extends TableConfig> {
    $without<TField extends keyof T['columns']>(
      ...fields: TField[]
    ): Omit<T['columns'], TField>
  }
}

PgTable.prototype.$without = function (...fields) {
  const columns = { ...this['_']['columns'] }
  for (const field of fields) {
    delete columns[field]
  }
  return columns
}
