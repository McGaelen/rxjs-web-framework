import type { Observable } from 'rxjs'

/**
 * All the primitives that are valid to add to DOM elements as attributes or children.
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

export type ChildKey = number | bigint | string
export type ChildValue = Primitive | HTMLElement
export type StaticChild =
  | ChildValue
  // An array containing a mix of static and reactive values (usually from using $``),
  // where the array itself is static (added/removed elements will not be reactive).
  | Array<ChildValue | Observable<ChildValue>>
export type ReactiveChild = Observable<
  // A reactive Primitive or HTMLElement
  | ChildValue
  // A reactive Array where changes cause the whole array to be re-built
  | Array<ChildValue>
  // A reactive Map where changes only effect the keyed element
  | Map<ChildKey, ChildValue>
>
export type Child = StaticChild | ReactiveChild

export type HTMLElementWithTeardown<Element extends HTMLElement = HTMLElement> =
  Element & { _teardown?: () => void }
export type ChildNodeWithKey = ChildNode & { _key: ChildKey }
