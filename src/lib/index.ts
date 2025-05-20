import { Observable, SubscriptionLike } from 'rxjs'

export * from './element'
export * from './state'
export * from './registry'

export type AttributeValue =
  | Observable<string>
  | string
  | ((...args: any) => any | void)
export type AttributeRecord = Record<string, AttributeValue>

// Anything that can be a added as a child element is a ChildExpression
export type ChildExpression =
  | ChildBaseExpression
  | ChildBaseExpression[]
  | Observable<ChildBaseExpression>
  | Observable<ChildBaseExpression[]>
export type ChildList = Array<ChildExpression>
export type Children = Array<ChildExpression | ChildList> // Can be up to 3d array depending on if $`` is used as an argument to an element's children prop.
export type ChildBaseExpression =
  | number
  | string
  | boolean
  | HTMLElement
  | null
  | undefined

export type HTMLElementWithTeardown<Element extends HTMLElement = HTMLElement> =
  Element & { _teardown?: () => void }

export type SubscriptionOrEventListener =
  | SubscriptionLike
  | { ref: HTMLElement; eventProp: string }
