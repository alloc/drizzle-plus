import type { Simplify } from 'radashi'
import {
  type MergeRelationsFilter,
  mergeRelationsFilter,
} from './mergeRelationsFilter'
import type { AnyDBQueryConfig } from './types'

export type MergeFindManyArgs<
  TLeft extends AnyDBQueryConfig,
  TRight extends AnyDBQueryConfig,
> = Simplify<{
  limit: MergeProperty<TLeft, TRight, 'limit'>
  offset: MergeProperty<TLeft, TRight, 'offset'>
  orderBy: MergeProperty<TLeft, TRight, 'orderBy'>
  columns: MergeObjects<TLeft['columns'], TRight['columns']>
  extras: MergeObjects<TLeft['extras'], TRight['extras']>
  with: MergeObjects<TLeft['with'], TRight['with']>
  where: MergeRelationsFilter<TLeft['where'], TRight['where']>
}>

/**
 * Merge two objects intended to be passed to `db.query#findMany`. The
 * `columns`, `with`, and `extras` properties are merged one level deep. The
 * `where` property is merged using the `mergeRelationsFilter` function.
 *
 * **Arguments:**
 * - The first argument must be an instance of `RelationalQueryBuilder`, which
 * is used for type safety and auto-completion.
 * - The other two arguments are the `DBQueryConfig` objects.
 */
export function mergeFindManyArgs<
  const TLeft extends AnyDBQueryConfig,
  const TRight extends AnyDBQueryConfig,
>(
  {
    columns: leftColumns,
    extras: leftExtras,
    with: leftWith,
    where: leftWhere,
    ...left
  }: TLeft,
  {
    columns: rightColumns,
    extras: rightExtras,
    with: rightWith,
    where: rightWhere,
    ...right
  }: TRight
): MergeFindManyArgs<TLeft, TRight> {
  return {
    ...left,
    ...right,
    columns: mergeObjects(leftColumns, rightColumns),
    extras: mergeObjects(leftExtras, rightExtras),
    with: mergeObjects(leftWith, rightWith),
    where: mergeRelationsFilter(leftWhere, rightWhere),
  } as any
}

type MergeObjects<TLeft, TRight> = TLeft extends object
  ? TRight extends object
    ? {
        [K in keyof TLeft | keyof TRight]: MergeProperty<TLeft, TRight, K>
      }
    : TLeft
  : TRight extends object
    ? TRight
    : undefined

function mergeObjects<
  TLeft extends object | null | undefined,
  TRight extends object | null | undefined,
>(left: TLeft, right: TRight): MergeObjects<TLeft, TRight>

function mergeObjects(
  left: object | null | undefined,
  right: object | null | undefined
): any {
  return left && right ? { ...left, ...right } : left || right || undefined
}

type MergeProperty<
  TLeft,
  TRight,
  Key extends keyof TLeft | keyof TRight,
> = Key extends keyof TLeft
  ? Key extends keyof TRight
    ? Omit<TRight, Key> extends TRight
      ? TLeft[Key] | Exclude<TRight[Key], undefined>
      : TRight[Key]
    : TLeft[Key]
  : Key extends keyof TRight
    ? TRight[Key]
    : never
