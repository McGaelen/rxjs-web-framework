import { SubscriptionLike } from 'rxjs'

export type SubscriptionOrEventListener =
  | SubscriptionLike
  | { ref: HTMLElement; eventProp: string }

export type RegisterFn = (sub: SubscriptionOrEventListener) => void
