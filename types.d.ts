import { BehaviorSubject, Observable, SubscriptionLike } from "rxjs"
import { State } from "./state"

declare global {
  type AttributeValue =
    | Observable<string>
    | string
    | ((...args: any) => any | void)
  type AttributeRecord = Record<string, AttributeValue>

  type ChildExpression = number | string | HTMLElement
  type ChildList = Array<ChildExpression | Observable<ChildExpression>>
  type ChildTaggedTemplateFn<T extends ReactiveHTMLElement> = (
    strings?: TemplateStringsArray,
    ...expressions: ChildList
  ) => T

  type ReactiveHTMLElement<Element extends HTMLElement = HTMLElement> =
    Element & { _destroy?: () => void }

  type SubscriptionOrEventListener =
    | SubscriptionLike
    | { ref: HTMLElement; eventProp: string }
}
