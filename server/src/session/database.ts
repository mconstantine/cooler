import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { CoolerError, PositiveInteger } from '../misc/Types'
import {
  SessionCreationInput,
  SessionUpdateInput,
  DatabaseSession
} from './interface'

export function insertSession(
  session: SessionCreationInput
): TaskEither<CoolerError, PositiveInteger> {
  return insert('session', session, SessionCreationInput)
}

export function updateSession(
  id: PositiveInteger,
  session: SessionUpdateInput
): TaskEither<CoolerError, PositiveInteger> {
  return update('session', id, session, SessionUpdateInput)
}

export function deleteSession(
  id: PositiveInteger
): TaskEither<CoolerError, PositiveInteger> {
  return remove('session', { id })
}

export function getSessionById(
  id: PositiveInteger
): TaskEither<CoolerError, Option<DatabaseSession>> {
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
