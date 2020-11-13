import { ResolverFn, withFilter } from 'apollo-server-express'
import { TaskEither } from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { Context, UserContext } from '../user/interface'
import { PubSub } from 'apollo-server-express'
import { constFalse, pipe } from 'fp-ts/function'
import { either, task, taskEither } from 'fp-ts'

const pubsub = new PubSub()

interface Subscription<
  P,
  C,
  TI extends t.Type<any, any>,
  TO extends t.Type<any, any>
> {
  argsCodec: TI
  resultCodec: TO
  key: string
  filter: (
    args: t.TypeOf<TI>,
    parent: P,
    context: C
  ) => TaskEither<unknown, boolean>
  publish: (result: t.TypeOf<TO>) => t.TypeOf<TO>
}

interface Subscriptions {
  [key: string]: Subscription<any, any, any, any>
}

export function createSubscription<
  P = any,
  C extends Context = UserContext,
  TI extends t.Type<any, any> = t.Type<any, any>,
  TO extends t.Type<any, any> = t.Type<any, any>
>(
  argsCodec: TI,
  resultCodec: TO,
  key: string,
  filter: (
    parent: P,
    args: t.TypeOf<TI>,
    context: C
  ) => TaskEither<unknown, boolean>
): Subscription<P, C, TI, TO> {
  return {
    argsCodec,
    resultCodec,
    key,
    filter,
    publish: result => {
      pipe(result, resultCodec.encode, (result: t.OutputOf<TO>) =>
        pubsub.publish(key, result)
      )

      return result
    }
  }
}

export function createSubscriptions(
  subscription: Subscriptions
): {
  [K in keyof Subscriptions]: ResolverFn
} {
  return Object.entries(subscription)
    .map(([key, subscription]): [string, ResolverFn] => {
      return [
        key,
        withFilter(
          () => pubsub.asyncIterator([subscription.key]),
          (parent, args, context) =>
            pipe(
              args,
              subscription.argsCodec.decode,
              either.fold(
                () => task.fromIO(constFalse),
                args =>
                  pipe(
                    subscription.filter(parent, args, context),
                    taskEither.fold(
                      () => task.fromIO(constFalse),
                      result => task.fromIO(() => result)
                    )
                  )
              ),
              task => task()
            )
        )
      ]
    })
    .reduce(
      (res, [key, resolverFn]) => ({
        ...res,
        [key]: resolverFn
      }),
      {}
    )
}
