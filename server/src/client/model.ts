import {
  Client,
  ClientCreationInput,
  ClientUpdateInput,
  DatabaseClient
} from './interface'
import { TaskEither } from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import {
  getClientById,
  insertClient,
  updateClient as updateDatabaseClient,
  deleteClient as deleteDatabaseClient
} from './database'
import { CoolerError, coolerError, unsafeNonEmptyString } from '../misc/Types'
import { NonEmptyString } from 'io-ts-types'
import { getUserById } from '../user/database'
import { a18n } from '../misc/a18n'
import { ObjectId, WithId } from 'mongodb'
import { User } from '../user/interface'

export function createClient(
  input: ClientCreationInput,
  user: WithId<User>
): TaskEither<CoolerError, WithId<Client>> {
  return pipe(
    insertClient(input, user._id),
    taskEither.chain(({ insertedId }) => getClientById(insertedId)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          a18n`Unable to retrieve the client after creation`
        )
      )
    )
  )
}

export function getClient(
  _id: ObjectId,
  user: WithId<User>
): TaskEither<CoolerError, WithId<Client>> {
  return pipe(
    getClientById(_id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The client you are looking for was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        client => client.user.equals(user._id),
        () => coolerError('COOLER_403', a18n`You cannot see this client`)
      )
    )
  )
}

// export function listClients(
//   args: ClientConnectionQuerysArgs,
//   user: User
// ): TaskEither<CoolerError, Connection<Client>> {
//   const where = SQL`WHERE user = ${user.id}`

//   pipe(
//     args.name,
//     option.fold(constVoid, name =>
//       where.append(SQL`
//         AND (
//           (type = 'BUSINESS' AND business_name LIKE ${`%${name}%`}) OR
//           (type = 'PRIVATE' AND first_name || ' ' || last_name LIKE ${`%${name}%`})
//         )`)
//     )
//   )

//   return queryToConnection(args, ['*'], 'client', DatabaseClient, where)
// }

export function updateClient(
  _id: ObjectId,
  input: ClientUpdateInput,
  user: WithId<User>
): TaskEither<CoolerError, WithId<Client>> {
  return pipe(
    getClientById(_id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The client you want to update was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        client => (input.user || client.user).equals(user._id),
        () => coolerError('COOLER_403', a18n`You cannot update this client`)
      )
    ),
    taskEither.chain(client =>
      pipe(
        updateDatabaseClient(client._id, { ...input, user: user._id }),
        taskEither.map(() => client)
      )
    ),
    taskEither.chain(client => getClientById(client._id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          a18n`Unable to retrieve the client after update`
        )
      )
    )
  )
}

export function deleteClient(
  _id: ObjectId,
  user: WithId<User>
): TaskEither<CoolerError, WithId<Client>> {
  return pipe(
    getClientById(_id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The client you want to delete was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        client => client.user.equals(user._id),
        () => coolerError('COOLER_403', a18n`You cannot delete this client`)
      )
    ),
    taskEither.chain(client =>
      pipe(
        deleteDatabaseClient(client._id),
        taskEither.map(() => client)
      )
    )
  )
}

export function getClientName(client: Client): NonEmptyString {
  switch (client.type) {
    case 'PRIVATE':
      return unsafeNonEmptyString(`${client.firstName} ${client.lastName}`)
    case 'BUSINESS':
      return client.businessName
  }
}

export function getClientUser(
  client: DatabaseClient
): TaskEither<CoolerError, User> {
  return pipe(
    getUserById(client.user),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The user of this client was not found`)
      )
    )
  )
}

// TODO:
// export function getUserClients(
//   user: DatabaseUser,
//   args: ConnectionQueryArgs
// ): TaskEither<CoolerError, Connection<Client>> {
//   return queryToConnection(
//     args,
//     ['*'],
//     'client',
//     Client,
//     SQL`WHERE user = ${user.id}`
//   )
// }
