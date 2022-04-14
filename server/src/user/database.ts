import { ObjectId } from 'bson'
import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { DeleteResult, UpdateResult, WithId } from 'mongodb'
import { dbGet, deleteOne, insertOne, updateOne } from '../misc/dbUtils'
import { removeUndefined } from '../misc/removeUndefined'
import { CoolerError, EmailString } from '../misc/Types'
import {
  DatabaseUser,
  User,
  userCollection,
  UserCreationInput,
  UserUpdateInput
} from './interface'

export function getUserByEmail(
  email: EmailString
): TaskEither<CoolerError, Option<WithId<DatabaseUser>>> {
  return dbGet(userCollection, { email })
}

export function getUserById(
  _id: ObjectId
): TaskEither<CoolerError, Option<WithId<DatabaseUser>>> {
  return dbGet(userCollection, { _id })
}

export function insertUser(
  user: UserCreationInput
): TaskEither<CoolerError, ObjectId> {
  return pipe(
    insertOne(userCollection, user),
    taskEither.map(result => result.insertedId)
  )
}

export function updateUser(
  _id: ObjectId,
  user: UserUpdateInput
): TaskEither<CoolerError, UpdateResult> {
  const data = removeUndefined({
    ...user,
    password: user.password ? option.toUndefined(user.password) : undefined
  }) as Partial<User>

  return updateOne(userCollection, { _id }, data)
}

export function deleteUser(
  _id: ObjectId
): TaskEither<CoolerError, DeleteResult> {
  return deleteOne(userCollection, { _id })
}
