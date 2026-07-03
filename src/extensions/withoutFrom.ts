/* #dialect.extraTypeImports */
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
  Column,
  Dialect,
  SelectBase,
  SelectBuilder,
  SelectConfig,
  Session,
  SetOperatorWithResult,
  SelectedFields,
  SelectedFieldsOrdered,
} from '#dialect/core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { SelectResultFields } from 'drizzle-orm/query-builders/select.types'
import { orderSelectedFields } from 'drizzle-plus/utils'

declare module '#dialect/core' {
  interface SelectBuilder</* #dialect.selectBuilderFromTypeParams */> {
    withoutFrom(): TSelection extends SelectedFields
      ? SelectWithoutFrom<TSelection>
      : never
  }
}

type SelectBuilderPrivate = {
  fields: ColumnsSelection
  session?: Session
  dialect: Dialect
  withList: Subquery[]
  distinct?: boolean | { on: (Column | SQLWrapper)[] }
}

export class SelectWithoutFrom<TSelection extends SelectedFields>
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

  constructor(select: SelectBuilderPrivate, selectedFields: TSelection) {
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

export interface SelectWithoutFrom<TSelection extends SelectedFields>
  extends QueryPromise<SelectResultFields<TSelection>[]> {
  execute(): Promise<SelectResultFields<TSelection>[]>
}

Object.defineProperties(SelectWithoutFrom.prototype, {
  ...Object.getOwnPropertyDescriptors(SelectBase.prototype),
  constructor: {
    value: SelectWithoutFrom,
  },
})

SelectBuilder.prototype.withoutFrom = function (): any {
  const { fields } = this as unknown as {
    fields: SelectedFields | undefined
  }
  if (!fields) {
    throw new DrizzleError({ message: 'Selection is required' })
  }
  return new SelectWithoutFrom(this as any, fields)
}
