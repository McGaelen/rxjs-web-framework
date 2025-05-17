import {BehaviorSubject, Observable, SubscriptionLike} from "rxjs";
import {IfControlFlowBuilder} from './control'

declare global {
  type AttributeValue = Observable<string> | string | (() => (any | void))
  type AttributeRecord<T extends HTMLElement> = Record<keyof T, AttributeValue>
  type ChildList = Array<string | HTMLElement | Observable<string | HTMLElement> | IfControlFlowBuilder>
  type ChildTaggedTemplateFn<T extends HTMLElement> = (strings: string[], ...expressions: ChildList) => T

  type State<T> = BehaviorSubject<T> & { set$: (newVal: T) => void }

  type IfCondition = any | Observable<any>
  type ThenFn = () => (HTMLElement | string)

  type SubscriptionOrEventListener = SubscriptionLike | {ref: HTMLElement, eventProp: string}
}
