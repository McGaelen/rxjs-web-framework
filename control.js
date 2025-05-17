import {map, forkJoin, combineLatest} from "rxjs";

/**
 * @param condition {any | import('rxjs').Observable<any>}
 * @param thenFn {() => HTMLElement}
 * @returns {IfControlFlowBuilder}
 */
export function iif(condition, thenFn) {
  return new IfControlFlowBuilder(condition, thenFn)
}

export class IfControlFlowBuilder {
  /** @type boolean */
  #elseUsed = false

  /** @type {Array<{condition: any | import('rxjs').Observable<any>, thenFn: () => HTMLElement}>} */
  #conditionList = []

  /** @type {() => HTMLElement} */
  #elseThenFn = null

  /**
   * @param condition {any | import('rxjs').Observable<any>}
   * @param thenFn {() => HTMLElement}
   */
  constructor(condition, thenFn) {
    this.#addCondition(condition, thenFn)
  }

  /**
   * @param condition {IfCondition}
   * @param thenFn {() => HTMLElement}
   * @returns {IfControlFlowBuilder}
   */
  elseIf(condition, thenFn) {
    return this.#addCondition(condition, thenFn)
  }

  /**
   * @param thenFn {() => HTMLElement}
   * @returns {IfControlFlowBuilder}
   */
  else(thenFn) {
    if (!this.#elseUsed) {
      this.#elseUsed = true
      this.#elseThenFn = thenFn
    } else {
      throw new Error('else used more than once')
    }
    return this
  }

  /** @returns {import('rxjs').Observable<string | HTMLElement>} */
  build() {
    return combineLatest(
      this.#conditionList.map(({condition, thenFn}) => {
        return condition.pipe(map(cond => ({ condition: cond, thenFn })))
      })
    ).pipe(
      map(conditions => {
        for (const {condition, thenFn} of conditions) {
          if (condition) return thenFn()
        }
        return this.#elseThenFn?.()
      })
    )
  }

  /**
   * @param condition {IfCondition}
   * @param thenFn {() => HTMLElement}
   * @returns {IfControlFlowBuilder}
   */
  #addCondition(condition, thenFn) {
    this.#conditionList.push({condition, thenFn})
    return this
  }
}