// mysql-insert: import type { PreparedQueryHKTBase } from 'drizzle-orm/mysql-core'
import {
  ColumnsSelection,
  DrizzleError,
  QueryPromise,
  SQL,
  sql,
  SQLWrapper,
  Subquery,
} from 'drizzle-orm'
import {
  PgColumn,
  PgDialect,
  PgSelectBase,
  PgSelectBuilder,
  PgSelectConfig,
  PgSession,
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

type PgSelectBuilderPrivate = {
  fields: ColumnsSelection
  session?: PgSession
  dialect: PgDialect
  withList: Subquery[]
  distinct?: boolean | { on: (PgColumn | SQLWrapper)[] }
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

  declare private config: {
    fields: PgSelectConfig['fields']
    withList?: PgSelectConfig['withList']
  }

  declare private joinsNotNullableMap: Record<string, boolean>
  declare private session: PgSession | undefined
  declare private dialect: PgDialect
  declare private usedTables: Set<string>

  constructor(select: PgSelectBuilderPrivate, selectedFields: TSelection) {
    super()

    // Any property required by PgSelectBase#_prepare must be here.
    this.config = { fields: { ...selectedFields }, withList: select.withList }
    this.joinsNotNullableMap = {}
    this.session = select.session
    this.dialect = select.dialect
    this.usedTables = new Set()

    // This is required by TypedQueryBuilder#getSelectedFields
    this._ = { selectedFields } as any
  }
  getSQL() {
    const dialect = this.dialect as unknown as {
      buildSelection: (fields: SelectedFieldsOrdered) => SQL
      buildWithCTE: (withList: Subquery[] | undefined) => SQL | undefined
    }
    const orderedFields = orderSelectedFields<PgColumn>(this._.selectedFields)
    const withSql = dialect.buildWithCTE(this.config.withList)
    return sql`${withSql}select ${dialect.buildSelection(orderedFields)}`
  }
  execute(placeholderValues?: Record<string, unknown>) {
    return this._prepare().execute(placeholderValues)
  }
  // Inherited from PgSelectBase.
  declare private _prepare: () => {
    execute: (
      placeholderValues?: Record<string, unknown>
    ) => Promise<SelectResultFields<TSelection>[]>
  }
}

export interface PgSelectWithoutFrom<TSelection extends SelectedFields>
  extends QueryPromise<SelectResultFields<TSelection>[]> {
  execute(): Promise<SelectResultFields<TSelection>[]>
}

Object.defineProperties(PgSelectWithoutFrom.prototype, {
  ...Object.getOwnPropertyDescriptors(PgSelectBase.prototype),
  constructor: {
    value: PgSelectWithoutFrom,
  },
})

PgSelectBuilder.prototype.withoutFrom = function (): any {
  const { fields } = this as unknown as {
    fields: SelectedFields | undefined
  }
  if (!fields) {
    throw new DrizzleError({ message: 'Selection is required' })
  }
  return new PgSelectWithoutFrom(this as any, fields)
}
