// See https://github.com/microsoft/TypeScript/issues/37663 on why `typeof x === 'function'` won't narrow x to a callable
export function isSetFn<T>(value: unknown): value is (arg: T) => T {
  return typeof value === 'function'
}
