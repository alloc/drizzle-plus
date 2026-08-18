import { sql, type SQL } from 'drizzle-orm'
import type { MergeFindManyArgs } from 'drizzle-plus'
import type {
  InferFindFirstArgs,
  InferFindManyArgs,
  InferOrderBy,
  InferRelations,
  QueryToResult,
  QueryToSQL,
  ResultFieldsToSelection,
  ReturningClause,
  ReturningResultFields,
  SQLResult,
} from 'drizzle-plus/types'
import { db } from './config/client'
import * as schema from './config/schema'

const listQuery = db.query.user.findMany({
  columns: { id: true },
})
const firstQuery = db.query.user.findFirst({
  columns: { id: true },
})
const nullableExpression = sql<number | null>`null`

type UserListArgs = InferFindManyArgs<typeof db.query.user>
type UserFirstArgs = InferFindFirstArgs<typeof db.query.user>
type UserRelations = InferRelations<typeof db.query.user>
type UserOrderBy = Exclude<InferOrderBy<typeof db.query.user>, Function>

const listArgs: UserListArgs = {
  where: { id: 1 },
  orderBy: { id: 'asc' },
}
const firstArgs: UserFirstArgs = {
  where: { id: 1 },
}
const relations: UserRelations = {
  emails: true,
}
const orderBy: UserOrderBy = { id: 'desc' }
// @ts-expect-error Order directions are restricted to asc/desc.
const invalidOrderBy: UserOrderBy = { id: 'sideways' }

expectTypeOf(listArgs).toHaveProperty('where')
expectTypeOf(firstArgs).toHaveProperty('where')
expectTypeOf(relations).toHaveProperty('emails')
expectTypeOf(orderBy).toEqualTypeOf<{
  id?: 'asc' | 'desc'
  name?: 'asc' | 'desc'
  age?: 'asc' | 'desc'
  handle?: 'asc' | 'desc'
}>()

expectTypeOf<QueryToResult<typeof listQuery>>().toEqualTypeOf<
  { id: number }[]
>()
expectTypeOf<
  QueryToResult<typeof listQuery, { single: true }>
>().toEqualTypeOf<{ id: number } | null>()
expectTypeOf<
  QueryToResult<typeof listQuery, { single: true; notNull: true }>
>().toEqualTypeOf<{ id: number }>()
expectTypeOf<QueryToResult<typeof listQuery, { scalar: true }>>().toEqualTypeOf<
  number | null
>()
expectTypeOf<
  QueryToResult<typeof listQuery, { scalar: true; notNull: true }>
>().toEqualTypeOf<number>()
expectTypeOf<QueryToResult<typeof firstQuery>>().toEqualTypeOf<{
  id: number
} | null>()
expectTypeOf<
  QueryToSQL<typeof listQuery, { scalar: true; notNull: true }>
>().toEqualTypeOf<SQL<number>>()

expectTypeOf<SQLResult<typeof schema.user.id>>().toEqualTypeOf<number>()
expectTypeOf<SQLResult<typeof schema.user.name>>().toEqualTypeOf<
  string | null
>()
expectTypeOf<SQLResult<typeof nullableExpression>>().toEqualTypeOf<
  number | null
>()

expectTypeOf<
  ReturningResultFields<'one', typeof schema.user, { id: true; name: true }>
>().toEqualTypeOf<{ id: number; name: string | null }>()
expectTypeOf<
  ReturningResultFields<'many', typeof schema.user, { id: false }>
>().toEqualTypeOf<
  { name: string | null; age: number | null; handle: string | null }[]
>()
expectTypeOf<
  ReturningResultFields<'one', typeof schema.user, {}>
>().toEqualTypeOf<undefined>()
expectTypeOf<
  ResultFieldsToSelection<{ id: number; name: string | null }>
>().toMatchTypeOf<{ id: SQL<number>; name: SQL<string | null> }>()

type LeftArgs = {
  columns: { id: true }
  extras: { label: SQL<string> }
  limit: 10
  where: { id: 1 }
}
type RightArgs = {
  columns: { name: true }
  extras: { status: SQL<boolean> }
  limit: 2
  where: { name: 'Ada' }
}
type MergedArgs = MergeFindManyArgs<LeftArgs, RightArgs>

expectTypeOf<MergedArgs['columns']>().toEqualTypeOf<{
  id: true
  name: true
}>()
expectTypeOf<MergedArgs['extras']>().toEqualTypeOf<{
  label: SQL<string>
  status: SQL<boolean>
}>()
expectTypeOf<MergedArgs['limit']>().toEqualTypeOf<2>()
expectTypeOf<MergedArgs['where']>().toEqualTypeOf<{ id: 1 } | { name: 'Ada' }>()
