import {
  Client,
  ClientCreationInput,
  ClientUpdateInput,
  foldClientCreationInput,
  ClientCreationCommonInput,
  PrivateClientCreationInput,
  BusinessClientCreationInput,
  DatabaseClient,
  ClientUpdateCommonInput,
  foldClientUpdateInput,
  PrivateClientUpdateInput,
  BusinessClientUpdateInput,
  foldClient
} from './interface'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { DatabaseUser, User } from '../user/interface'
import { ApolloError } from 'apollo-server-express'
import { Connection } from '../misc/Connection'
import { TaskEither } from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import {
  getClientById,
  insertClient,
  updateClient as updateDatabaseClient,
  deleteClient as deleteDatabaseClient
} from './database'
import { coolerError, PositiveInteger } from '../misc/Types'
import { NonEmptyString } from 'io-ts-types'
import { getUserById } from '../user/database'
import { ClientConnectionQuerysArgs } from './resolvers'

export function createClient(
  input: ClientCreationInput,
  user: User
): TaskEither<ApolloError, Client> {
  const commonInput: ClientCreationCommonInput & { user: PositiveInteger } = {
    address_city: input.address_city,
    address_country: input.address_country,
    address_email: input.address_email,
    address_province: input.address_province,
    address_street: input.address_street,
    address_street_number: input.address_street_number,
    address_zip: input.address_zip,
    user: user.id
  }

  return pipe(
    input,
    foldClientCreationInput(
      (input): PrivateClientCreationInput => ({
        ...commonInput,
        type: input.type,
        first_name: input.first_name,
        last_name: input.last_name,
        fiscal_code: input.fiscal_code
      }),
      (input): BusinessClientCreationInput => ({
        ...commonInput,
        // @ts-ignore
        type: input.type,
        country_code: input.country_code,
        business_name: input.business_name,
        vat_number: input.vat_number
      })
    ),
    insertClient,
    taskEither.chain(id => getClientById(id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          'Unable to retrieve the client after creation'
        )
      )
    )
  )
}

export function getClient(
  id: PositiveInteger,
  user: User
): TaskEither<ApolloError, Client> {
  return pipe(
    getClientById(id),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'Client not found'))
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        client => client.user === user.id,
        () => coolerError('COOLER_403', 'You cannot see this client')
      )
    )
  )
}

export function listClients(
  args: ClientConnectionQuerysArgs,
  user: User
): TaskEither<ApolloError, Connection<Client>> {
  const where = SQL`WHERE user = ${user.id}`

  if (args.name) {
    where.append(SQL`
      AND (
        (type = 'BUSINESS' AND business_name LIKE ${`%${args.name}%`}) OR
        (type = 'PRIVATE' AND first_name || ' ' || last_name LIKE ${`%${args.name}%`})
      )`)
  }

  return queryToConnection(args, ['*'], 'client', DatabaseClient, where)
}

export function updateClient(
  id: PositiveInteger,
  input: ClientUpdateInput,
  user: User
): TaskEither<ApolloError, Client> {
  return pipe(
    getClientById(id),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'Client not found'))
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        client => (input.user || client.user) === user.id,
        () => coolerError('COOLER_403', 'You cannot update this client')
      )
    ),
    taskEither.chain(client => {
      const commonInput: ClientUpdateCommonInput = {
        address_country: input.address_country,
        address_province: input.address_province,
        address_city: input.address_city,
        address_zip: input.address_zip,
        address_street: input.address_street,
        address_street_number: input.address_street_number,
        address_email: input.address_email,
        user: user.id
      }

      const update: ClientUpdateInput = pipe(
        { ...input, type: input.type || client.type },
        foldClientUpdateInput(
          (input): PrivateClientUpdateInput => ({
            ...commonInput,
            type: input.type,
            first_name: input.first_name,
            last_name: input.last_name,
            fiscal_code: input.fiscal_code
          }),
          (input): BusinessClientUpdateInput => ({
            ...commonInput,
            // @ts-ignore
            type: input.type,
            country_code: input.country_code,
            business_name: input.business_name,
            vat_number: input.vat_number
          })
        )
      )

      return pipe(
        updateDatabaseClient(client.id, update),
        taskEither.map(() => client)
      )
    }),
    taskEither.chain(client => getClientById(client.id)),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'Client not found'))
    )
  )
}

export function deleteClient(
  id: PositiveInteger,
  user: User
): TaskEither<ApolloError, Client> {
  return pipe(
    getClientById(id),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'Client not found'))
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        client => client.user === user.id,
        () => coolerError('COOLER_403', 'You cannot delete this client')
      )
    ),
    taskEither.chain(client =>
      pipe(
        deleteDatabaseClient(client.id),
        taskEither.map(() => client)
      )
    )
  )
}

export function getClientName(client: Client): NonEmptyString {
  return pipe(
    client,
    foldClient(
      client => `${client.first_name} ${client.last_name}` as NonEmptyString,
      client => client.business_name
    )
  )
}

export function getClientUser(
  client: DatabaseClient
): TaskEither<ApolloError, User> {
  return pipe(
    getUserById(client.user),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'User not found'))
    )
  )
}

export function getUserClients(
  user: DatabaseUser,
  args: ConnectionQueryArgs
): TaskEither<ApolloError, Connection<Client>> {
  return queryToConnection(
    args,
    ['*'],
    'client',
    Client,
    SQL`WHERE user = ${user.id}`
  )
}
