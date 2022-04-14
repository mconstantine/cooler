import { boolean } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { WithId, ObjectId as MongoObjectId } from 'mongodb'

export interface Collection<I, O> {
  name: string
  props: t.Props
  codec: t.Type<O, I>
}

export function makeCollection<I, O>(
  name: string,
  props: t.Props,
  codec: t.Type<O, I>
): Collection<I, O> {
  return { name, props, codec }
}

// TODO: this is straight up dumb.
export const ObjectId = new t.Type<MongoObjectId, MongoObjectId>(
  'ObjectId',
  (u): u is MongoObjectId => MongoObjectId.isValid(u as any),
  (u, c) =>
    pipe(
      MongoObjectId.isValid(u as any),
      boolean.fold(
        () => t.failure(u, c, 'ObjectId is not valid'),
        () => t.success(u as MongoObjectId)
      )
    ),
  s => new MongoObjectId(s)
)
export type ObjectId = t.TypeOf<typeof ObjectId>

export const ObjectIdFromString = new t.Type<MongoObjectId, string>(
  'ObjectIdFromString',
  (u): u is MongoObjectId => MongoObjectId.isValid(u as any),
  (u, c) =>
    pipe(
      MongoObjectId.isValid(u as any),
      boolean.fold(
        () => t.failure(u, c, 'ObjectId is not valid'),
        () => t.success(new MongoObjectId(u as string))
      )
    ),
  _id => _id.toHexString()
)
export type ObjectIdFromString = t.TypeOf<typeof ObjectIdFromString>

export function WithIdC<C extends t.Mixed>(
  codec: C,
  name = `WithId<${codec.name}>`
): t.Type<WithId<t.TypeOf<C>>, t.OutputOf<C>, unknown> {
  return t.intersection(
    [
      codec,
      t.type({
        _id: ObjectId
      })
    ],
    name
  ) as t.Type<WithId<t.TypeOf<C>>, t.OutputOf<C>, unknown>
}
