// mysql-insert: import type { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import { DrizzleError, SQL, sql } from 'drizzle-orm'
import {
  PgColumn,
  PgDialect,
  PgSelectBuilder,
  PgSetOperatorWithResult,
  SelectedFields,
  SelectedFieldsOrdered,
} from 'drizzle-orm/pg-core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { SelectResultFields } from 'drizzle-orm/query-builders/select.types'
import { orderSelectedFields } from 'drizzle-plus/utils'

declare module 'drizzle-orm/pg-core' {
  interface PgSelectBuilder<
    TSelection extends SelectedFields | undefined,
    // mysql-insert: TPreparedQueryHKT extends PreparedQueryHKTBase,
    // sqlite-insert: TResultType extends 'sync' | 'async', TRunResult,
    TBuilderMode extends 'db' | 'qb',
  > {
    withoutFrom(): TSelection extends SelectedFields
      ? PgSelectWithoutFrom<TSelection>
      : never
  }
}

export class PgSelectWithoutFrom<TSelection extends SelectedFields>
  extends TypedQueryBuilder<TSelection, SelectResultFields<TSelection>[]>
  implements PgSetOperatorWithResult<SelectResultFields<TSelection>[]>
{
  _: {
    readonly hkt: any
    readonly tableName: any
    readonly selection: any
    readonly selectMode: any
    readonly nullabilityMap: any
    readonly dynamic: any
    readonly excludedMethods: any
    readonly result: SelectResultFields<TSelection>[]
    readonly selectedFields: TSelection
  }
  constructor(
    selectedFields: SelectedFields,
    private readonly dialect: PgDialect
  ) {
    super()
    this._ = {
      // This is used by TypedQueryBuilder#getSelectedFields
      selectedFields,
    } as any // Everything else is just for type safety?
  }
  getSQL() {
    const dialect = this.dialect as unknown as {
      buildSelection: (fields: SelectedFieldsOrdered) => SQL
    }
    const orderedFields = orderSelectedFields<PgColumn>(this._.selectedFields)
    return sql`select ${dialect.buildSelection(orderedFields)}`
  }
}

PgSelectBuilder.prototype.withoutFrom = function (): any {
  const { fields, dialect } = this as unknown as {
    fields: SelectedFields | undefined
    dialect: PgDialect
  }
  if (!fields) {
    throw new DrizzleError({ message: 'Selection is required' })
  }
  return new PgSelectWithoutFrom(fields, dialect)
}
