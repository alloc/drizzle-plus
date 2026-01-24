import {
  Column,
  is,
  OrderBy,
  RelationsFilter,
  relationsOrderToSQL,
  sql,
  SQL,
  Subquery,
  Table,
  WithSubquery,
} from 'drizzle-orm'
import {
  type PgDeleteBase,
  type PgInsertBase,
  PgSelectBase,
  PgUpdateBase,
} from 'drizzle-orm/pg-core'
import { PgRelationalQuery } from 'drizzle-orm/pg-core/query-builders/query'
import { getContext, getFilterSQL, getReturningFields } from '../pg/internal'
import { RelationalQueryBuilder } from '../pg/types'

export type { PgRelationalQuery as RelationalQuery }

export type InsertQuery = PgInsertBase<any, any, any>

export function selectRowsToUpdateOrDelete(
  rqb: RelationalQueryBuilder<any, any>,
  limit: number,
  where?: RelationsFilter<any, any>,
  orderBy?: OrderBy | SQL
): Subquery[] {
  const ctx = getContext(rqb)

  const builder = new PgSelectBase({
    fields: {
      ctid: sql.raw('ctid') as any,
    },
    dialect: ctx.dialect,
    session: ctx.session,
    distinct: undefined,
    withList: [],
  }) as PgSelectBase<
    any,
    any,
    any,
    any,
    any,
    true, // TDynamic (This is ridiculous.)
    any,
    any,
    any
  >

  const selection = builder
    .for('update')
    .where(where && getFilterSQL(rqb, where))
    .limit(limit)

  if (orderBy && !is(orderBy, SQL)) {
    orderBy = relationsOrderToSQL(ctx.table, orderBy)
  }
  if (orderBy) {
    selection.orderBy(orderBy)
  }

  return [
    new WithSubquery(
      selection.getSQL(),
      (selection as any).getSelectedFields(),
      'matched_rows',
      true
    ),
  ]
}

export function innerJoinMatchedRows(
  table: Table,
  query: PgUpdateBase<any, any, any> | PgDeleteBase<any, any, any>
) {
  if (query instanceof PgUpdateBase) {
    query.from(sql`matched_rows`).where(sql`${table}.ctid = matched_rows.ctid`)
  } else {
    throw new Error(
      'Drizzle does not support joins in delete queries. See https://github.com/drizzle-team/drizzle-orm/issues/3100'
    )
  }
}

export function setReturningClauseForUpdateOrDelete(
  query: { returning(fields: any): any },
  returningOption:
    | Record<string, unknown>
    | ((columns: Record<string, Column>) => Record<string, unknown>)
    | undefined,
  columns: Record<string, Column>
) {
  const returning =
    returningOption && getReturningFields(returningOption, columns)
  if (returning) {
    query.returning(returning)
  }
}

// Not supported in Postgres.
export declare function limitUpdateOrDelete(...args: any): void
