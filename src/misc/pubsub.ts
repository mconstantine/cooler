import { pubsub } from '../pubsub'
import { Context, UserContext } from '../user/interface'

export interface SubscriptionImplementation<T> {
  subscribe: () => AsyncIterator<T>
}

export type Subscription<T> = Record<string, SubscriptionImplementation<T>>

export function publish<
  T,
  O extends Record<string, SubscriptionImplementation<T>>
>(triggerName: string, content: Partial<{ [key in keyof O]: T }>) {
  return pubsub.publish(triggerName, content)
}

export type WithFilter<
  V extends Record<string, any>,
  O extends Record<string, SubscriptionImplementation<T>> = Record<
    string,
    SubscriptionImplementation<any>
  >,
  C extends Context = UserContext,
  T = any
> = (
  payload: { [key in keyof O]: T },
  variables: V,
  context: C
) => boolean | Promise<boolean>
