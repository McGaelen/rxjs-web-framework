import {BehaviorSubject} from "rxjs";

/**
 * @template T
 * @returns {State<T>}
 */
export function state(initialVal) {
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

  return obs
}
