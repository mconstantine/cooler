import { PubSub } from 'apollo-server-express'

export type SQLDate = string
export type ID = number

export interface SubscriptionImplementation<T> {
  subscribe: () => AsyncIterator<T>
}

export type Subscription<T> = Record<string, SubscriptionImplementation<T>>

export function publish<
  T,
  O extends Record<string, SubscriptionImplementation<T>>
>(
  pubsub: PubSub,
  triggerName: string,
  content: Partial<{ [key in keyof O]: T }>
) {
  return pubsub.publish(triggerName, content)
}
