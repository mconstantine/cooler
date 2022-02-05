import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { CoolerError, EmailString, PositiveInteger } from '../misc/Types'
import { DatabaseUser, UserCreationInput, UserUpdateInput } from './interface'

export function getUserByEmail(
  email: EmailString
): TaskEither<CoolerError, Option<DatabaseUser>> {
  return dbGet(SQL`SELECT * FROM user WHERE email = ${email}`, DatabaseUser)
}

export function getUserById(
  id: PositiveInteger
): TaskEither<CoolerError, Option<DatabaseUser>> {
  return dbGet(SQL`SELECT * FROM user WHERE id = ${id}`, DatabaseUser)
}

export function insertUser(
  user: UserCreationInput
): TaskEither<CoolerError, PositiveInteger> {
  return insert('user', user, UserCreationInput)
}

export function updateUser(
  id: PositiveInteger,
  user: UserUpdateInput
): TaskEither<CoolerError, PositiveInteger> {
  return update('user', id, user, UserUpdateInput)
}

export function deleteUser(
  id: PositiveInteger
): TaskEither<CoolerError, PositiveInteger> {
  return remove('user', { id })
}
