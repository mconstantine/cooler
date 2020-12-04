import { ApolloError } from 'apollo-server-express'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { PositiveInteger } from '../misc/Types'
import {
  ClientCreationInput,
  ClientUpdateInput,
  DatabaseClient
} from './interface'

export function insertClient(
  client: ClientCreationInput
): TaskEither<ApolloError, PositiveInteger> {
  return insert('client', client, ClientCreationInput)
}

export function updateClient(
  id: PositiveInteger,
  client: ClientUpdateInput
): TaskEither<ApolloError, PositiveInteger> {
  return update('client', id, client, ClientUpdateInput)
}

export function deleteClient(
  id: PositiveInteger
): TaskEither<ApolloError, PositiveInteger> {
  return remove('client', { id })
}

export function getClientById(
  id: PositiveInteger
): TaskEither<ApolloError, Option<DatabaseClient>> {
  return dbGet(SQL`SELECT * FROM client WHERE id = ${id}`, DatabaseClient)
}
