import {AttributeRecord, ChildExpression} from "./types";
import {Observable} from "rxjs";

export function isChildExpressionOrObservable(
    val: AttributeRecord | ChildExpression,
): val is ChildExpression {
  return (
      /** Check for all types in {@link Primitive}, except for null and undefined */
      ['number', 'bigint', 'boolean', 'string'].includes(typeof val) ||
      val instanceof HTMLElement ||
      Array.isArray(val) ||
      isObservable(val) // AttributeRecords themselves cannot be observables, only AttributeValues can
  )
}

export function isObservable<T>(val: any): val is Observable<T> {
  return val?.subscribe && typeof val?.subscribe === 'function'
}
