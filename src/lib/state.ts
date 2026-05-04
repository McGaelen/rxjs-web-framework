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

// See https://github.com/microsoft/TypeScript/issues/37663 on why `typeof x === 'function'` won't narrow x to a callable
export function isSetFn<T>(value: unknown): value is (arg: T) => T {
  return typeof value === 'function'
}
