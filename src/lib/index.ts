import { Observable, SubscriptionLike } from "rxjs"

export * from './element'
export * from './state'
export * from './registry'


export type AttributeValue =
  | Observable<string>
  | string
  | ((...args: any) => any | void)
export type AttributeRecord = Record<string, AttributeValue>

export type ChildExpression = number | string | HTMLElement
export type ChildExpressionOrObservable = ChildExpression | Observable<ChildExpression>
export type ChildList = Array<ChildExpressionOrObservable>
export type Children = Array<ChildExpressionOrObservable | ChildList> // Can be a 2d array depending on if $`` is used as an argument to an element's children prop.

export type HTMLElementWithTeardown<Element extends HTMLElement = HTMLElement> =
  Element & { _teardown?: () => void }

export type SubscriptionOrEventListener =
  | SubscriptionLike
  | { ref: HTMLElement; eventProp: string }
