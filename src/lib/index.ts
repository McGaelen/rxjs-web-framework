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
export type ChildList = Array<ChildExpression | Observable<ChildExpression>>
export type ChildTaggedTemplateFn<T extends ReactiveHTMLElement> = (
  strings?: TemplateStringsArray,
  ...expressions: ChildList
) => T

export type ReactiveHTMLElement<Element extends HTMLElement = HTMLElement> =
  Element & { _destroy?: () => void }

export type SubscriptionOrEventListener =
  | SubscriptionLike
  | { ref: HTMLElement; eventProp: string }

