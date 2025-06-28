import { SQL, sql } from 'drizzle-orm'
import type { SQLExpression } from '../types'

export class SQLCaseWhen<T = never> {
  cases: SQL<T>
  constructor(init?: SQL<T> | SQLCaseWhen<T>) {
    // Clone the initial cases to enable re-use.
    this.cases = init
      ? sql`${init instanceof SQLCaseWhen ? init.cases : init}`
      : sql<T>`CASE`
  }

  /**
   * Add a case to the case expression.
   */
  when<Then>(whenExpr: SQLExpression, thenExpr: SQLExpression<Then>) {
    this.cases.append(sql` WHEN ${whenExpr} THEN ${thenExpr}`)
    return this as SQLCaseWhen<T | Then>
  }

  /**
   * Add the else clause to the case expression.
   */
  else<Else>(elseExpr: SQLExpression<Else>) {
    return sql`${this.cases} ELSE ${elseExpr} END` as SQL<T | Else>
  }

  /**
   * Finish the case expression without an else clause, which will
   * return `null` if no case matches.
   */
  elseNull() {
    return sql`${this.cases} END` as SQL<T | null>
  }
}

export function caseWhen<Then>(
  whenExpr: SQLExpression,
  thenExpr: SQLExpression<Then>
) {
  return new SQLCaseWhen().when(whenExpr, thenExpr)
}
