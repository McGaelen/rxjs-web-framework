import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs'

export class State<T> extends BehaviorSubject<T> {
  constructor(initialVal: T) {
    super(initialVal)
  }

  set(newValOrFn: T | ((prevState: T) => T)) {
    if (isSetFn<T>(newValOrFn)) {
      const returnedVal = newValOrFn(this.value)
      this.next(returnedVal)
    } else {
      this.next(newValOrFn)
    }
  }

  derive<NewType>(deriveFn: (currentVal: T) => NewType): Observable<NewType> {
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
  arrayState$: State<Array<ArrayType>>,
  eachFn: (val: ArrayType, index: number, array: Array<ArrayType>) => NewType,
): Observable<Array<NewType>> {
  const valueMap = new Map<number | bigint | string, NewType>()
  return arrayState$.derive((currentArray) => {
    const values = currentArray.map(eachFn)

    values.forEach((value, idx) => {
      let key: number | bigint | string = idx
      if (value instanceof HTMLElement && value.hasAttribute('data-key')) {
        key = value.getAttribute('data-key')!
      }
      if (!valueMap.has(key) || valueMap.get(key) !== value) {
        valueMap.set(key, value)
      }
      // How do we know which keys have been removed?
      // How do we know which keys have been re-ordered?
      //
    })
  })
}

// See https://github.com/microsoft/TypeScript/issues/37663 on why `typeof x === 'function'` won't narrow x to a callable
function isSetFn<T>(value: unknown): value is (arg: T) => T {
  return typeof value === 'function'
}
