import { Observable } from 'rxjs'

export * from './element'
export * from './state'
export * from './registry'

/**
 * All the primitives that are valid to add to DOM elements as attributes or children (with the except on null and undefined.)
 * number, bigint, and booleans will have toString() called on them.
 * strings are added as-is.
 * null and undefined are ignored - they won't add anything to the DOM at all.
 */
export type Primitive = number | bigint | boolean | string | null | undefined

export type AttributeBaseExpression = Primitive | ((...args: any) => unknown)
export type AttributeValue =
  | AttributeBaseExpression
  | Observable<AttributeBaseExpression>
export type AttributeRecord = Record<string, AttributeValue>

export type ChildBaseExpression = Primitive | HTMLElement
export type ChildExpression =
  | ChildBaseExpression
  | ChildBaseExpression[] //TODO: support plain arrays
  | Observable<ChildBaseExpression | ChildBaseExpression[]>
// | Observable<>
export type ChildList = Array<ChildExpression>

export type HTMLElementWithTeardown<Element extends HTMLElement = HTMLElement> =
  Element & { _teardown?: () => void }
