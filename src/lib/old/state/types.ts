export type EachFn<T, V> = (val: T, index: number, array: Array<T>) => V

export type KeyedEachFn<T, K, V> = EachFn<T, { key: K; value: V }>
