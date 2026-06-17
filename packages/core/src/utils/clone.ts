/** Clone profond d'une valeur JSON-sérialisable (le `Project` l'est par construction). */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
