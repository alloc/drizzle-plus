import { DrizzleError, SQL, SQLChunk } from 'drizzle-orm'
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
 * valuesList([[1, 'a'], [2, 'b']]) // SQL { "values (1, 'a'), (2, 'b')" }
 *
 * valuesList([{ a: 1 }, { a: 2 }]) // SQL { "values (1), (2)" }
 * ```
 */
export function valuesList<T extends object | unknown[]>(rows: T[]): SQL {
  if (!rows.length) {
    throw new DrizzleError({ message: 'No rows provided' })
  }

  const chunks: SQLChunk[] = []

  pushStringChunk(chunks, 'values ')

  const keys = Object.keys(rows[0])

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    pushStringChunk(chunks, '(')

    let row: any = rows[rowIndex]
    keys.forEach((key, keyIndex) => {
      chunks.push(row[key] as SQLChunk)

      if (keyIndex < keys.length - 1) {
        pushStringChunk(chunks, ', ')
      }
    })

    pushStringChunk(chunks, ')')

    if (rowIndex < rows.length - 1) {
      pushStringChunk(chunks, ', ')
    }
  }

  return new SQL(chunks)
}
