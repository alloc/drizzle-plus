export type InferCastResult<T extends SQLType | (string & {})> =
  SQLType extends T ? unknown : T extends SQLType ? SQLTypeToJS[T] : unknown

export type SQLType = string & keyof SQLTypeToJS

export interface SQLTypeToJS {
  integer: number
  real: number
  text: string
  blob: any
}
