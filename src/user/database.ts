import { ApolloError } from 'apollo-server-express'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { EmailString, PositiveInteger } from '../misc/Types'
import { DatabaseUser, UserCreationInput, UserUpdateInput } from './interface'

export function getUserByEmail(
  email: EmailString
): TaskEither<ApolloError, Option<DatabaseUser>> {
  return dbGet(SQL`SELECT * FROM user WHERE email = ${email}`, DatabaseUser)
}

export function getUserById(
  id: PositiveInteger
): TaskEither<ApolloError, Option<DatabaseUser>> {
  return dbGet(SQL`SELECT * FROM user WHERE id = ${id}`, DatabaseUser)
}

export function insertUser(
  user: UserCreationInput
): TaskEither<ApolloError, PositiveInteger> {
  return insert('user', user, UserCreationInput)
}

export function updateUser(
  id: PositiveInteger,
  user: Omit<UserUpdateInput, 'id'>
): TaskEither<ApolloError, PositiveInteger> {
  return update('user', id, { ...user }, UserUpdateInput)
}

export function deleteUser(
  id: PositiveInteger
): TaskEither<ApolloError, PositiveInteger> {
  return remove('user', { id })
}
