import { getColumns } from 'drizzle-orm'
import { Table, TableConfig } from '#dialect/core'

declare module '#dialect/core' {
  interface Table<T extends TableConfig> {
    $without<TField extends keyof T['columns']>(
      ...fields: TField[]
    ): Omit<T['columns'], TField>
  }
}

Table.prototype.$without = function (...fields) {
  const columns = { ...getColumns(this) }
  for (const field of fields) {
    delete columns[field]
  }
  return columns
}
