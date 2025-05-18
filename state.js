import {BehaviorSubject, combineLatest, map} from "rxjs";

/**
 * @template T
 * @returns {State<T>}
 */
export function state$(initialVal) {
  /** @type {State<T>} */
  const obs = new BehaviorSubject(initialVal)

  obs.set$ = (newVal) => {
    if (typeof newVal === 'function') {
      const returnedVal = newVal(obs.value)
      obs.next(returnedVal)
    } else {
      obs.next(newVal)
    }
  }

  obs.derive$ = (deriveFn) => {
    return obs.pipe(map(deriveFn))
  }

  return obs
}

/**
 * @param deriveFn {(...vals: any) => (any | void)}
 * @param deps {Array<import('rxjs').Observable>}
 */
export function derive$(deriveFn, deps) {
  return combineLatest(deps).pipe(map(vals => deriveFn(...vals)))
}
