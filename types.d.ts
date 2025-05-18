import {BehaviorSubject, Observable, SubscriptionLike} from "rxjs";

declare global {
  type AttributeValue = Observable<string> | string | ((...args: any) => (any | void))
  type AttributeRecord = Record<string, AttributeValue>
  type ChildList = Array<string | HTMLElement | Observable<string | HTMLElement>>
  type ChildTaggedTemplateFn<T extends HTMLElement> = (strings: string[], ...expressions: ChildList) => T

  type State<T> = BehaviorSubject<T> & { set$: (newVal: T) => void }

  type SubscriptionOrEventListener = SubscriptionLike | {ref: HTMLElement, eventProp: string}
}
