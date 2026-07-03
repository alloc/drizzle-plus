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
  PgColumn as Column,
  PgDialect as Dialect,
  PgSelectBase as SelectBase,
  PgSelectBuilder as SelectBuilder,
  PgSelectConfig as SelectConfig,
  PgSession as Session,
  PgSetOperatorWithResult as SetOperatorWithResult,
  SelectedFields,
  SelectedFieldsOrdered,
} from 'drizzle-orm/pg-core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { SelectResultFields } from 'drizzle-orm/query-builders/select.types'
import { orderSelectedFields } from 'drizzle-plus/utils'

declare module 'drizzle-orm/pg-core' {
  interface PgSelectBuilder<TSelection extends SelectedFields | undefined,
    TBuilderMode extends 'db' | 'qb'> {
    withoutFrom(): TSelection extends SelectedFields
      ? PgSelectWithoutFrom<TSelection>
      : never
  }
}

type PgSelectBuilderPrivate = {
  fields: ColumnsSelection
  session?: Session
  dialect: Dialect
  withList: Subquery[]
  distinct?: boolean | { on: (Column | SQLWrapper)[] }
}

export class PgSelectWithoutFrom<TSelection extends SelectedFields>
  extends TypedQueryBuilder<TSelection, SelectResultFields<TSelection>[]>
  implements SetOperatorWithResult<SelectResultFields<TSelection>[]>
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
    fields: SelectConfig['fields']
    withList?: SelectConfig['withList']
  }

  declare private joinsNotNullableMap: Record<string, boolean>
  declare private session: Session | undefined
  declare private dialect: Dialect
  declare private usedTables: Set<string>

  constructor(select: PgSelectBuilderPrivate, selectedFields: TSelection) {
    super()

    // Any property required by SelectBase#_prepare must be here.
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
    const orderedFields = orderSelectedFields<Column>(this._.selectedFields)
    const withSql = dialect.buildWithCTE(this.config.withList)
    return sql`${withSql}select ${dialect.buildSelection(orderedFields)}`
  }
  execute(placeholderValues?: Record<string, unknown>) {
    return this._prepare().execute(placeholderValues)
  }
  // Inherited from SelectBase.
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
  ...Object.getOwnPropertyDescriptors(SelectBase.prototype),
  constructor: {
    value: PgSelectWithoutFrom,
  },
})

SelectBuilder.prototype.withoutFrom = function (): any {
  const { fields } = this as unknown as {
    fields: SelectedFields | undefined
  }
  if (!fields) {
    throw new DrizzleError({ message: 'Selection is required' })
  }
  return new PgSelectWithoutFrom(this as any, fields)
}
