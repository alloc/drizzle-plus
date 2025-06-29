import type { SQL, SQLWrapper } from 'drizzle-orm'
import { AnyDBQueryConfig, AnyRelationsFilter } from './types'

type FilterOperators = {
  OR?: AnyRelationsFilter[]
  AND?: AnyRelationsFilter[]
  NOT?: AnyRelationsFilter
  RAW?: SQLWrapper | ((table: any, operators: any) => SQL)
}

export type MergeRelationsFilter<
  TLeft extends AnyDBQueryConfig['where'],
  TRight extends AnyDBQueryConfig['where'],
> =
  // Punt on actually merging these, as it's very complicated and not strictly
  // necessary in most cases. Return a union of the two, so the compiler can at
  // least verify both types are valid (e.g. when passed to `findMany`).
  TLeft | TRight

/**
 * Merge two `where` filters for Drizzle's Relational API.
 */
export function mergeRelationsFilter<
  TLeft extends AnyDBQueryConfig['where'],
  TRight extends AnyDBQueryConfig['where'],
>(left: TLeft, right: TRight): MergeRelationsFilter<TLeft, TRight> {
  if (!left || !right) {
    return (left ?? right) as MergeRelationsFilter<TLeft, TRight>
  }

  const mergedOps: FilterOperators = {}

  const leftOps = left as FilterOperators
  const rightOps = right as FilterOperators

  if (leftOps.OR && rightOps.OR) {
    mergedOps.AND ??= [...(leftOps.AND ?? []), ...(rightOps.AND ?? [])]
    mergedOps.AND.push({ OR: leftOps.OR }, { OR: rightOps.OR })
    mergedOps.OR = undefined
  }
  if (leftOps.RAW && rightOps.RAW) {
    mergedOps.AND ??= [...(leftOps.AND ?? []), ...(rightOps.AND ?? [])]
    mergedOps.AND.push({ RAW: leftOps.RAW }, { RAW: rightOps.RAW })
    mergedOps.RAW = undefined
  }

  if (leftOps.NOT && rightOps.NOT) {
    mergedOps.NOT = { ...leftOps.NOT, ...rightOps.NOT }
  }

  return {
    ...left,
    ...right,
    ...mergedOps,
  } as MergeRelationsFilter<TLeft, TRight>
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
