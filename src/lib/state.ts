import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs'
import { ChildKey } from './index'

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
  deriveFn: (...vals: any[]) => NewType,
  deps: Observable<any>[],
): Observable<NewType> {
  return combineLatest(deps).pipe(map((vals) => deriveFn(...vals)))
}

export function each$<ArrayType, NewType>(
  array$: State<Array<ArrayType>>,
  eachFn: (val: ArrayType, index: number, array: Array<ArrayType>) => NewType,
): Observable<Array<NewType>> {
  return array$.derive$((array) => array.map(eachFn))
}

export function map$<ArrayType, NewType>(
  array$: State<Array<ArrayType>>,
  eachFn: (
    val: ArrayType,
    index: number,
    array: Array<ArrayType>,
  ) => { key: ChildKey; value: NewType },
): Observable<Map<`${ChildKey}~${number}`, NewType>> {
  return each$(array$, eachFn).pipe(
    map((array) =>
      array.reduce(
        (map, value, idx) => map.set(`${value.key}~${idx}`, value.value),
        new Map(),
      ),
    ),
  )
}

// See https://github.com/microsoft/TypeScript/issues/37663 on why `typeof x === 'function'` won't narrow x to a callable
function isSetFn<T>(value: unknown): value is (arg: T) => T {
  return typeof value === 'function'
}
