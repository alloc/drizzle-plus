/**
 * Any JSON-native primitive value.
 */
export type JSONPrimitive = string | number | boolean | null

/**
 * Any object that can be serialized to a JSON object. This includes
 * complex objects that implement the `toJSON` method.
 */
export type JSONObjectCodable =
  | { [key: string]: JSONCodable | undefined }
  | { toJSON(): JSONObject }

/**
 * Any value that can be serialized to JSON. This includes complex objects
 * that implement the `toJSON` method.
 */
export type JSONCodable =
  | JSONPrimitive
  | { [key: string]: JSONCodable | undefined }
  | { toJSON(): JSON }
  | readonly JSONCodable[]

/**
 * Any JSON-native object.
 */
export type JSONObject = { [key: string]: JSON | undefined }

/**
 * Any JSON-native value.
 */
export type JSON = JSONPrimitive | JSONObject | readonly JSON[]
