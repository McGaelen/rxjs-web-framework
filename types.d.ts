import {BehaviorSubject, Observable} from "rxjs";

declare global {
  type AttributeValue = Observable<string> | string | (() => (any | void))
  type AttributeRecord<T extends HTMLElement> = Record<keyof T, AttributeValue>
  type ChildList = Array<string | HTMLElement | Observable<string | HTMLElement>>
  type ChildTaggedTemplateFn<T extends HTMLElement> = (strings: string[], ...expressions: ChildList) => T

  type State<T> = BehaviorSubject<T> & { $set: (newVal: T) => void }
}
