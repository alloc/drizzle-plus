export type InferCastResult<T extends SQLType | (string & {})> =
  SQLType extends T ? unknown : T extends SQLType ? SQLTypeToJS[T] : unknown

export type SQLType = string & keyof SQLTypeToJS

export interface SQLTypeToJS {
  // Numeric types
  tinyint: number
  smallint: number
  mediumint: number
  int: number
  bigint: number
  float: number
  double: number
  decimal: number
  real: number
  boolean: boolean

  // Character types
  char: string
  varchar: string
  text: string

  // Date/time types
  date: string
  time: string
  datetime: string

  // JSON
  json: any
}
