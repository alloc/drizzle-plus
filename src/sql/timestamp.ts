import { SQL } from 'drizzle-orm'

export class SQLTimestamp<T extends string | null> extends SQL<T> {
  toDate(): SQL<Date | Extract<T, null>> {
    const result = new SQL(this.queryChunks).mapWith(value =>
      value !== null ? new Date(value as string) : value
    )
    return result as SQL<Date | Extract<T, null>>
  }
}
