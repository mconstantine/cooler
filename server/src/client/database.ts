import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { DeleteResult, InsertOneResult, ObjectId, UpdateResult } from 'mongodb'
import { dbGet, deleteOne, insertOne, updateOne } from '../misc/dbUtils'
import { CoolerError } from '../misc/Types'
import {
  Client,
  clientCollection,
  ClientCreationInput,
  clientCreationInputToDatabaseClient,
  ClientUpdateInput,
  clientUpdateInputToDatabaseClient
} from './interface'

export function insertClient(
  client: ClientCreationInput,
  userId: ObjectId
): TaskEither<CoolerError, InsertOneResult> {
  return insertOne(
    clientCollection,
    clientCreationInputToDatabaseClient(client, userId)
  )
}

export function updateClient(
  _id: ObjectId,
  client: ClientUpdateInput
): TaskEither<CoolerError, UpdateResult> {
  return updateOne(
    clientCollection,
    { _id },
    clientUpdateInputToDatabaseClient(client)
  )
}

export function deleteClient(
  _id: ObjectId
): TaskEither<CoolerError, DeleteResult> {
  return deleteOne(clientCollection, { _id })
}

export function getClientById(
  _id: ObjectId
): TaskEither<CoolerError, Option<Client>> {
  return pipe(dbGet(clientCollection, { _id }))
}
