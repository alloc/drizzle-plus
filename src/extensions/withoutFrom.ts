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
  SelectHKTBase,
  Session,
  SetOperatorWithResult,
  SelectedFields,
  SelectedFieldsOrdered,
} from '#dialect/core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { SelectResultFields } from 'drizzle-orm/query-builders/select.types'
import { orderSelectedFields } from 'drizzle-plus/utils'
import * as adapter from './adapters/#dialect'

declare module '#dialect/core' {
  interface SelectBuilder<
    TSelection extends SelectedFields | undefined = SelectedFields | undefined,
    THKT extends SelectHKTBase = SelectHKTBase,
    TResultType extends 'sync' | 'async' = 'async',
    TRunResult = unknown,
    TBuilderMode extends 'db' | 'qb' = 'db',
    TPreparedQueryHKT = unknown,
  > {
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
    const query = this.dialect.sqlToQuery(this.getSQL())
    const orderedFields = orderSelectedFields<Column>(this._.selectedFields)
    const mapper = (this.dialect as any).mapperGenerators?.rows(
      orderedFields,
      {}
    )
    const session = this.session as any
    const metadata = { type: 'select', tables: [] }
    return adapter.executeSelect(
      session,
      query,
      mapper,
      metadata,
      placeholderValues
    )
  }
}

export interface SelectWithoutFrom<TSelection extends SelectedFields>
  extends QueryPromise<SelectResultFields<TSelection>[]> {
  execute(): Promise<SelectResultFields<TSelection>[]>
}

const selectBaseDescriptors = Object.getOwnPropertyDescriptors(
  SelectBase.prototype
)
delete selectBaseDescriptors.getSQL

Object.defineProperties(SelectWithoutFrom.prototype, {
  ...Object.getOwnPropertyDescriptors(QueryPromise.prototype),
  ...selectBaseDescriptors,
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
