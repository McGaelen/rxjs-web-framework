import {map, distinctUntilChanged, combineLatest} from "rxjs";

/**
 * @param condition {IfCondition}
 * @param thenFn {ThenFn}
 * @returns {IfControlFlowBuilder}
 */
export function iif(condition, thenFn) {
  return new IfControlFlowBuilder(condition, thenFn)
}

export class IfControlFlowBuilder {
  /** @type {Array<{condition: IfCondition, thenFn: ThenFn}>} */
  #conditionList = []

  /** @type {ThenFn} */
  #elseThenFn = null

  /**
   * @param condition {IfCondition}
   * @param thenFn {ThenFn}
   */
  constructor(condition, thenFn) {
    this.#addCondition(condition, thenFn)
  }

  /**
   * @param condition {IfCondition}
   * @param thenFn {ThenFn}
   * @returns {IfControlFlowBuilder}
   */
  elseIf(condition, thenFn) {
    return this.#addCondition(condition, thenFn)
  }

  /**
   * @param thenFn {ThenFn}
   * @returns {IfControlFlowBuilder}
   */
  else(thenFn) {
    if (!this.#elseThenFn) {
      this.#elseThenFn = thenFn
    } else {
      throw new Error('else used more than once')
    }
    return this
  }

  /** @returns {import('rxjs').Observable<string | HTMLElement | null | undefined>} */
  build() {
    return combineLatest(
      this.#conditionList.map(({condition, thenFn}) => {
        return condition.pipe(map(cond => ({ condition: cond, thenFn })))
      })
    ).pipe(
      map(conditions => {
        for (const {condition, thenFn} of conditions) {
          if (condition) return thenFn
        }
        return this.#elseThenFn
      }),
      distinctUntilChanged(),
      map(thenFn => thenFn?.())
    )
  }

  /**
   * @param condition {IfCondition}
   * @param thenFn {ThenFn}
   * @returns {IfControlFlowBuilder}
   */
  #addCondition(condition, thenFn) {
    this.#conditionList.push({condition, thenFn})
    return this
  }
}
