import { SQL, sql } from 'drizzle-orm'
import type { SQLExpression, SQLValue } from '../types'

export class SQLCaseWhen<T = never> {
  cases: SQL<T>[]
  constructor(init?: SQLCaseWhen<T>) {
    this.cases = init ? [...init.cases] : []
  }

  /**
   * Add a case to the case expression.
   */
  when<Then>(whenExpr: SQLExpression | undefined, thenExpr: SQLValue<Then>) {
    if (whenExpr) {
      this.cases.push(sql` WHEN ${whenExpr} THEN ${thenExpr}`)
    }
    return this as SQLCaseWhen<T | Then>
  }

  /**
   * Add the else clause to the case expression.
   */
  else<Else>(elseExpr: SQLValue<Else>): SQL<T | Else> {
    if (this.cases.length) {
      return sql`CASE ${sql.join(this.cases, '')} ELSE ${elseExpr} END`
    }
    return sql`${elseExpr}`
  }

  /**
   * Finish the case expression without an else clause, which will
   * return `null` if no case matches.
   */
  elseNull(): SQL<T | null> {
    if (this.cases.length) {
      return sql`CASE ${sql.join(this.cases, '')} END`
    }
    return sql`NULL`
  }
}

export function caseWhen<Then>(
  whenExpr: SQLExpression | undefined,
  thenExpr: SQLValue<Then>
) {
  return new SQLCaseWhen().when(whenExpr, thenExpr)
}
