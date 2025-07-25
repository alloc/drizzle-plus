import { DrizzleError, SQL, SQLChunk, Subquery } from 'drizzle-orm'
import { SQLWrapper } from 'drizzle-orm/sql'
import { SelectionFromAnyObject } from '../types'
import { pushStringChunk } from '../utils'

/**
 * Produces a SQL `values` list of one or more rows.
 *
 * The given array may contain tuples or objects. Each tuple/object **must have
 * the exact same keys** as the first row in the array, or unexpected behavior
 * may occur.
 *
 * @example
 * ```ts
 * db.select().from(valuesList([{ a: 1 }, { a: 2 }]).as('my_values'))
 * ```
 */
export function valuesList<T extends Record<string, unknown>>(
  rows: readonly T[]
): ValuesList<SelectionFromAnyObject<T>> {
  if (!rows.length) {
    throw new DrizzleError({ message: 'No rows provided' })
  }
  return new ValuesList(Object.keys(rows[0]), rows)
}

export class ValuesList<
  TSelectedFields extends Record<string, unknown> = Record<string, unknown>,
> implements SQLWrapper<unknown>
{
  declare _: {
    selectedFields: TSelectedFields
  }
  private shouldInlineParams = false
  constructor(
    private keys: string[],
    private rows: readonly object[]
  ) {}
  as<TAlias extends string>(alias: TAlias): Subquery<TAlias, TSelectedFields> {
    return new Subquery(
      this.getSQL(),
      this.rows[0] as Record<string, unknown>,
      alias
    )
  }
  getSQL() {
    const chunks: SQLChunk[] = []

    pushStringChunk(chunks, 'values ')

    for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
      pushStringChunk(chunks, '(')

      let row: any = this.rows[rowIndex]
      this.keys.forEach((key, keyIndex) => {
        chunks.push(row[key] as SQLChunk)

        if (keyIndex < this.keys.length - 1) {
          pushStringChunk(chunks, ', ')
        }
      })

      pushStringChunk(chunks, ')')

      if (rowIndex < this.rows.length - 1) {
        pushStringChunk(chunks, ', ')
      }
    }

    const query = new SQL(chunks)
    return this.shouldInlineParams ? query.inlineParams() : query
  }
  inlineParams() {
    this.shouldInlineParams = true
    return this
  }
}
