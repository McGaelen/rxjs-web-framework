import {
  BehaviorSubject,
  combineLatest, combineLatestAll,
  map, mergeAll,
  Observable,
  OperatorFunction, pipe, Subscription, tap,
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

  derive$<D>(deriveFn: (currentVal: T) => D): Observable<D> {
    return this.pipe(map(deriveFn), /*tap(val => console.log(val)),*/)
  }
}

export function state$<T>(initialVal: T): State<T> {
  return new State(initialVal)
}

// TODO: could improve with more generics for each value in Deps
export function derive$<D>(
  deriveFn: (...vals: any[]) => D,
  deps: Observable<any>[],
): Observable<D> {
  return combineLatest(deps).pipe(
    map((vals) => deriveFn(...vals))
  )
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

export function flattenArrayOfObservables<T>():
    OperatorFunction<Array<Observable<T>>, Array<T>> {
  // Takes an Observable which emits an array where each element in the array is an Observable.
  // Subscribe to each observable in the array. When any element Observable emits,
  // emit an array containing all the latest values from each element Observable.
  // Like combineLatestAll(), but doesn't wait until the outer observable completes.
  // Each element observable must emit a value before this function will emit.
  return (observable) => new Observable((subscriber) => {
    // this function will be called each time this Observable is subscribed to.


    const subscriptions: Subscription[] = []
    let hasCompleted = false
    const items: T[] = []

    const subscription = observable.subscribe({
      next(array) {
        // If the source has completed, we can complete the resulting observable.
        if (hasCompleted) {
          subscriber.complete()
        }

      array.forEach((inner$, idx) =>
          subscriptions.push(
              inner$.subscribe(inner =>
                  items.splice(idx, 1, inner)
          )
      ))

      },
      error(err) {
        // We need to make sure we're propagating our errors through.
        subscriber.error(err)
      },
      complete() {
        hasCompleted = true;
      },
    })
    subscriptions.push(subscription)

    // Return the finalization logic. This will be invoked when
    // the result errors, completes, or is unsubscribed.
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  })
}
