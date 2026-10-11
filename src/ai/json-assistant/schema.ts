export const INPUT_LIMIT = 16 * 1024;
export const SCHEMA_LIMIT = 64 * 1024;
const MAX_DEPTH = 20;
const MAX_NODES = 2000;
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
type JsonType =
  | 'null'
  | 'boolean'
  | 'number'
  | 'integer'
  | 'string'
  | 'array'
  | 'object';
export interface Schema {
  $schema?: string;
  type?: JsonType;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: Schema;
  anyOf?: Schema[];
}

export function parseJson(
  text: string,
  limit = INPUT_LIMIT,
  maxDepth = MAX_DEPTH,
  maxNodes = MAX_NODES
): JsonValue {
  if (!text.trim()) throw new Error('Enter JSON or load a sample first.');
  if (new TextEncoder().encode(text).length > limit)
    throw new Error(`Input exceeds the ${limit / 1024} KB limit.`);
  let value: JsonValue;
  try {
    value = JSON.parse(text) as JsonValue;
  } catch {
    throw new Error('Invalid JSON. Check quotes, commas and brackets.');
  }
  let nodes = 0;
  const inspect = (item: JsonValue, depth: number) => {
    if (++nodes > maxNodes || depth > maxDepth)
      throw new Error(
        `JSON is too complex (maximum ${maxDepth} levels and ${maxNodes.toLocaleString(
          'en'
        )} values).`
      );
    if (typeof item === 'number' && !Number.isFinite(item))
      throw new Error('Numbers must be finite.');
    if (item && typeof item === 'object')
      Object.values(item).forEach((child) => inspect(child, depth + 1));
  };
  inspect(value, 0);
  return value;
}

export function inferSchema(value: JsonValue): Schema {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    const variants = [
      ...new Map(
        value.map((item) => {
          const schema = inferSchema(item);
          return [JSON.stringify(schema), schema];
        })
      ).values()
    ];
    return {
      type: 'array',
      ...(variants.length
        ? { items: variants.length === 1 ? variants[0] : { anyOf: variants } }
        : {})
    };
  }
  if (typeof value === 'object')
    return {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, inferSchema(item)])
      ),
      required: Object.keys(value),
      additionalProperties: false
    };
  return {
    type:
      typeof value === 'number'
        ? Number.isInteger(value)
          ? 'integer'
          : 'number'
        : (typeof value as JsonType)
  };
}

/** Return a candidate that the same local validator can consume. */
export function createCandidateSchema(input: string): string {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...inferSchema(parseJson(input))
  };
  let candidate = JSON.stringify(schema, null, 2);
  if (new TextEncoder().encode(candidate).length > SCHEMA_LIMIT)
    candidate = JSON.stringify(schema);
  try {
    parseSchema(candidate);
  } catch {
    throw new Error(
      'The inferred schema exceeds local validation limits. Reduce the input size or complexity and try again.'
    );
  }
  return candidate;
}

/** Validate a deliberately small, documented JSON Schema subset; reject all
 * unsupported keywords rather than silently reporting that a schema passed. */
export function parseSchema(text: string): Schema {
  // Schema wrappers add levels and nodes compared with the original payload.
  const schema = parseJson(text, SCHEMA_LIMIT, 60, 12000);
  const allowed = new Set([
    '$schema',
    'type',
    'properties',
    'required',
    'additionalProperties',
    'items',
    'anyOf'
  ]);
  const types = new Set([
    'null',
    'boolean',
    'number',
    'integer',
    'string',
    'array',
    'object'
  ]);
  const inspect = (value: JsonValue, path: string, root: boolean) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error(`${path}: schema must be an object.`);
    for (const key of Object.keys(value))
      if (!allowed.has(key))
        throw new Error(`${path}: unsupported keyword "${key}".`);
    if (
      '$schema' in value &&
      (!root || value.$schema !== 'http://json-schema.org/draft-07/schema#')
    )
      throw new Error(
        `${path}: only the draft-07 declaration at the root is supported.`
      );
    if (
      'type' in value &&
      (typeof value.type !== 'string' || !types.has(value.type))
    )
      throw new Error(`${path}: unsupported type.`);
    if ('properties' in value) {
      if (
        value.type !== 'object' ||
        !value.properties ||
        typeof value.properties !== 'object' ||
        Array.isArray(value.properties)
      )
        throw new Error(`${path}: properties requires an object schema.`);
      for (const [key, child] of Object.entries(value.properties))
        inspect(child, `${path}.properties.${key}`, false);
    }
    if (
      'required' in value &&
      (value.type !== 'object' ||
        !Array.isArray(value.required) ||
        !value.required.every((key) => typeof key === 'string') ||
        new Set(value.required).size !== value.required.length)
    )
      throw new Error(`${path}: required must contain unique property names.`);
    if (
      'additionalProperties' in value &&
      (value.type !== 'object' ||
        typeof value.additionalProperties !== 'boolean')
    )
      throw new Error(
        `${path}: additionalProperties must be a boolean on an object schema.`
      );
    if ('items' in value) {
      if (value.type !== 'array')
        throw new Error(`${path}: items requires an array schema.`);
      inspect(value.items, `${path}.items`, false);
    }
    if ('anyOf' in value) {
      if (
        !Array.isArray(value.anyOf) ||
        !value.anyOf.length ||
        Object.keys(value).some((key) => !['anyOf', '$schema'].includes(key))
      )
        throw new Error(
          `${path}: anyOf must be non-empty and cannot be mixed with other constraints.`
        );
      value.anyOf.forEach((child, index) =>
        inspect(child, `${path}.anyOf[${index}]`, false)
      );
    }
  };
  inspect(schema, '$', true);
  return schema as unknown as Schema;
}

export function validateJson(
  value: JsonValue,
  schema: Schema,
  path = '$'
): string[] {
  if (schema.anyOf)
    return schema.anyOf.some(
      (variant) => validateJson(value, variant, path).length === 0
    )
      ? []
      : [`${path}: does not match any allowed shape.`];
  const actual =
    value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (
    schema.type &&
    (schema.type === 'integer'
      ? typeof value !== 'number' || !Number.isInteger(value)
      : actual !== schema.type)
  )
    return [`${path}: expected ${schema.type}, received ${actual}.`];
  if (
    schema.type === 'object' &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    const errors: string[] = [];
    for (const key of schema.required ?? [])
      if (!Object.hasOwn(value, key))
        errors.push(
          `${path}: missing required property ${JSON.stringify(key)}.`
        );
    for (const [key, item] of Object.entries(value)) {
      if (Object.hasOwn(schema.properties ?? {}, key))
        errors.push(
          ...validateJson(
            item,
            schema.properties![key],
            `${path}[${JSON.stringify(key)}]`
          )
        );
      else if (schema.additionalProperties === false)
        errors.push(`${path}: unexpected property ${JSON.stringify(key)}.`);
    }
    return errors;
  }
  if (schema.type === 'array' && Array.isArray(value) && schema.items)
    return value.flatMap((item, index) =>
      validateJson(item, schema.items!, `${path}[${index}]`)
    );
  return [];
}
