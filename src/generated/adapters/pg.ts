import {
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
  PgDeleteBase,
  PgSelectBase,
  PgSession,
  PgUpdateBase,
} from 'drizzle-orm/pg-core'
import { getContext, getFilterSQL } from '../pg/internal'
import { RelationalQueryBuilder } from '../pg/types'

export function execute<T>(session: PgSession, query: SQL) {
  return session.execute<T>(query)
}

export function selectRowsToUpdateOrDelete(
  rqb: RelationalQueryBuilder<any, any>,
  limit: number,
  where?: RelationsFilter<any, any>,
  orderBy?: OrderBy | SQL
): Subquery[] {
  const ctx = getContext(rqb)

  const selection = new PgSelectBase({
    fields: {
      ctid: sql.raw('ctid'),
    },
    table: ctx.table,
    dialect: ctx.dialect,
    session: ctx.session,
    distinct: undefined,
    isPartialSelect: false,
    withList: [],
  })
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
  query: PgUpdateBase<any, any> | PgDeleteBase<any, any>
) {
  if (query instanceof PgUpdateBase) {
    query.from(sql`matched_rows`).where(sql`${table}.ctid = matched_rows.ctid`)
  } else {
    throw new Error(
      'Drizzle does not support joins in delete queries. See https://github.com/drizzle-team/drizzle-orm/issues/3100'
    )
  }
}

// Not supported in Postgres.
export declare function limitUpdateOrDelete(...args: any): void
