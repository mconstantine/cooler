import { ApolloError } from 'apollo-server-express'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { PositiveInteger } from '../misc/Types'
import {
  SessionCreationInput,
  SessionUpdateInput,
  DatabaseSession
} from './interface'

export function insertSession(
  session: SessionCreationInput
): TaskEither<ApolloError, PositiveInteger> {
  return insert('session', session, SessionCreationInput)
}

export function updateSession(
  id: PositiveInteger,
  session: SessionUpdateInput
): TaskEither<ApolloError, PositiveInteger> {
  return update('session', id, session, SessionUpdateInput)
}

export function deleteSession(
  id: PositiveInteger
): TaskEither<ApolloError, PositiveInteger> {
  return remove('session', { id })
}

export function getSessionById(
  id: PositiveInteger
): TaskEither<ApolloError, Option<DatabaseSession>> {
  return dbGet(
    SQL`
      SELECT session.*, client.user
      FROM session
      JOIN task ON session.task = task.id
      JOIN project ON task.project = project.id
      JOIN client ON client.id = project.client
      WHERE session.id = ${id}
    `,
    DatabaseSession
  )
}
