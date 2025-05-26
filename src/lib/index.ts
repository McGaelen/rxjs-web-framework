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
  // A static, non-reactive value
  | ChildBaseExpression
  // An array containing a mix of static and reactive values (usually from using $``),
  // where the array itself is static (added/removed elements will not be reactive)
  | Array<ChildBaseExpression | Observable<ChildBaseExpression>>
  // A reactive value which can return the same as the above
  | Observable<
      // A reactive Primitive or HTMLElement
      | ChildBaseExpression
      // A reactive Array where changes cause the whole array to be re-built
      | Array<ChildBaseExpression>
    >

export type HTMLElementWithTeardown<Element extends HTMLElement = HTMLElement> =
  Element & { _teardown?: () => void }
