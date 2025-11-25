// Simple NoSQL injection sanitizer for Mongo queries.
// Removes any object keys starting with '$' or containing '.' recursively.
// For primitive values (string/number/boolean/null) returns as-is.
// For arrays, sanitizes each element.

export function sanitizeValue<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(sanitizeValue) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k.startsWith('$') || k.includes('.')) {
      continue; // drop suspicious operator-like keys
    }
    out[k] = sanitizeValue(v);
  }
  return out as T;
}

export function sanitizeInput<T>(input: T): T {
  return sanitizeValue(input);
}
