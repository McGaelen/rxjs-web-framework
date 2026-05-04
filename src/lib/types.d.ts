import type { Observable } from 'rxjs'
import type { ShadowRootBuilder } from './element'

declare global {
  type MaybeObservable<T> = T | Observable<T>

  type AttributeName = string
  type AttributeValue = string | ((e?: any) => void)
  type Attributes = Record<AttributeName, MaybeObservable<AttributeValue>>

  type Child = HTMLElement | string | ShadowRootBuilder
  type Children = MaybeObservable<Child>[]
}
