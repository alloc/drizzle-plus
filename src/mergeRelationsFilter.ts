import type { SQL, SQLWrapper } from 'drizzle-orm'

type MergedOperators = {
  OR?: object[]
  AND?: object[]
  NOT?: object
  RAW?: SQLWrapper | ((table: any, operators: any) => SQL)
}

export type MergeRelationsFilter<
  TLeft extends MergedOperators | undefined,
  TRight extends MergedOperators | undefined,
> =
  // Punt on actually merging these, as it's very complicated and not strictly
  // necessary in most cases. Return a union of the two, so the compiler can at
  // least verify both types are valid (e.g. when passed to `findMany`).
  Exclude<TLeft, undefined> | TRight

/**
 * Merge two `where` filters for Drizzle's RelationalQueryBuilder API.
 */
export function mergeRelationsFilter<
  TLeft extends MergedOperators,
  TRight extends MergedOperators | undefined,
>(left: TLeft | undefined, right: TRight): MergeRelationsFilter<TLeft, TRight> {
  if (!left || !right) {
    return (left ?? right) as MergeRelationsFilter<TLeft, TRight>
  }

  const mergedOps: MergedOperators = {}

  if (left.OR && right.OR) {
    mergedOps.AND ??= [...(left.AND ?? []), ...(right.AND ?? [])]
    mergedOps.AND.push({ OR: left.OR }, { OR: right.OR })
    mergedOps.OR = undefined
  }
  if (left.RAW && right.RAW) {
    mergedOps.AND ??= [...(left.AND ?? []), ...(right.AND ?? [])]
    mergedOps.AND.push({ RAW: left.RAW }, { RAW: right.RAW })
    mergedOps.RAW = undefined
  }

  if (left.NOT && right.NOT) {
    mergedOps.NOT = mergeRelationsFilter(left.NOT, right.NOT)
  }

  return {
    ...left,
    ...right,
    ...mergedOps,
  } as MergeRelationsFilter<TLeft, TRight>
}
