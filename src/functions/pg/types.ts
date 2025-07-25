export type InferCastResult<T extends SQLType | (string & {})> =
  SQLType extends T ? unknown : T extends SQLType ? SQLTypeToJS[T] : unknown

export type SQLType = string & keyof SQLTypeToJS

export interface SQLTypeToJS {
  // Numeric types
  int2: number
  int4: number
  int8: number
  smallint: number
  integer: number
  bigint: number
  decimal: number
  numeric: number
  real: number
  float4: number
  float8: number
  double: number
  serial: number
  bigserial: number
  money: number

  // Boolean
  bool: boolean

  // Character types
  char: string
  varchar: string
  text: string
  citext: string
  name: string

  // Date/time types
  date: string
  time: string
  timetz: string
  timestamp: any
  timestamptz: any
  interval: string

  // UUID
  uuid: string

  // JSON
  json: any
  jsonb: any

  // Network types
  inet: string
  cidr: string
  macaddr: string

  // Bit string types
  bit: string
  varbit: string
}
