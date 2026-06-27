// @ts-nocheck
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
  SQLiteColumn,
  SQLiteDialect,
  SQLiteSelectBase,
  SQLiteSelectBuilder,
  SQLiteSelectConfig,
  SQLiteSession,
  SQLiteSetOperatorWithResult,
  SelectedFields,
  SelectedFieldsOrdered,
} from 'drizzle-orm/sqlite-core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { SelectResultFields } from 'drizzle-orm/query-builders/select.types'
import { orderSelectedFields } from 'drizzle-plus/utils'

declare module 'drizzle-orm/sqlite-core' {
  interface SQLiteSelectBuilder<
    TSelection extends SelectedFields | undefined,
    TResultType extends 'sync' | 'async', TRunResult,
    TBuilderMode extends 'db' | 'qb',
  > {
    withoutFrom(): TSelection extends SelectedFields
      ? SQLiteSelectWithoutFrom<TSelection>
      : never
  }
}

type SQLiteSelectBuilderPrivate = {
  fields: ColumnsSelection
  session?: SQLiteSession
  dialect: SQLiteDialect
  withList: Subquery[]
  distinct?: boolean | { on: (SQLiteColumn | SQLWrapper)[] }
}

export class SQLiteSelectWithoutFrom<TSelection extends SelectedFields>
  extends TypedQueryBuilder<TSelection, SelectResultFields<TSelection>[]>
  implements SQLiteSetOperatorWithResult<SelectResultFields<TSelection>[]>
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
    fields: SQLiteSelectConfig['fields']
    withList?: SQLiteSelectConfig['withList']
  }

  declare private joinsNotNullableMap: Record<string, boolean>
  declare private session: SQLiteSession<any, any, any, any, any> | undefined
  declare private dialect: SQLiteDialect
  declare private usedTables: Set<string>

  constructor(select: SQLiteSelectBuilderPrivate, selectedFields: TSelection) {
    super()

    // Any property required by SQLiteSelectBase#_prepare must be here.
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
    const orderedFields = orderSelectedFields<SQLiteColumn>(this._.selectedFields)
    const withSql = dialect.buildWithCTE(this.config.withList)
    return sql`${withSql}select ${dialect.buildSelection(orderedFields)}`
  }
  execute(placeholderValues?: Record<string, unknown>) {
    return this._prepare().execute(placeholderValues)
  }
  // Inherited from SQLiteSelectBase.
  declare private _prepare: () => {
    execute: (
      placeholderValues?: Record<string, unknown>
    ) => Promise<SelectResultFields<TSelection>[]>
  }
}

export interface SQLiteSelectWithoutFrom<TSelection extends SelectedFields>
  extends QueryPromise<SelectResultFields<TSelection>[]> {
  execute(): Promise<SelectResultFields<TSelection>[]>
}

Object.defineProperties(SQLiteSelectWithoutFrom.prototype, {
  ...Object.getOwnPropertyDescriptors(SQLiteSelectBase.prototype),
  constructor: {
    value: SQLiteSelectWithoutFrom,
  },
})

SQLiteSelectBuilder.prototype.withoutFrom = function (): any {
  const { fields } = this as unknown as {
    fields: SelectedFields | undefined
  }
  if (!fields) {
    throw new DrizzleError({ message: 'Selection is required' })
  }
  return new SQLiteSelectWithoutFrom(this as any, fields)
}
