import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  OperatorFunction,
} from 'rxjs'
import { EachFn, KeyedEachFn } from './types'
import { get } from 'lodash-es'
import { isSetFn } from './utils'

export class State<T> extends BehaviorSubject<T> {
  constructor(initialVal: T) {
    super(initialVal)
  }

  set$(newValOrFn: T | ((prevState: T) => T)) {
    if (isSetFn<T>(newValOrFn)) {
      const returnedVal = newValOrFn(this.value)
      this.next(returnedVal)
    } else {
      this.next(newValOrFn)
    }
  }

  derive$<NewType>(deriveFn: (currentVal: T) => NewType): Observable<NewType> {
    return this.pipe(map(deriveFn))
  }
}

export function state$<T>(initialVal: T): State<T> {
  return new State(initialVal)
}

// TODO: could improve with more generics for each value in Deps
export function derive$<NewType>(
  deps: Observable<any>[],
  deriveFn: (...vals: any[]) => NewType,
): Observable<NewType> {
  return combineLatest(deps).pipe(map((vals) => deriveFn(...vals)))
}

export function each$<T, N>(
  array$: State<Array<T>>,
  eachFn: EachFn<T, N>,
): Observable<Array<N>> {
  return array$.derive$((array) => array.map(eachFn))
}

export function map$<T, K, V>(
  array$: State<Array<T>>,
  eachFnOrStringKey: KeyedEachFn<T, K, V> | string,
  eachFn?: EachFn<T, V>,
): Observable<Map<K, V>> {
  const mapPipe: OperatorFunction<Array<{ key: K; value: V }>, Map<K, V>> = map(
    (array) =>
      array.reduce((map, { key, value }) => map.set(key, value), new Map()),
  )

  if (typeof eachFnOrStringKey === 'function') {
    return each$(array$, eachFnOrStringKey).pipe(mapPipe)
  } else if (eachFn) {
    return each$(array$, (val, index, array) => {
      const newVal = eachFn(val, index, array)
      return {
        key: get(val, eachFnOrStringKey),
        value: newVal,
      }
    }).pipe(mapPipe)
  }
  throw new Error('Invalid arguments to map$.')
}
