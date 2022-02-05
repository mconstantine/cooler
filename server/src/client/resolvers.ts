import { Client, ClientCreationInput, ClientUpdateInput } from './interface'
import {
  createClient,
  listClients,
  updateClient,
  deleteClient,
  getClient
} from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { ensureUser } from '../misc/ensureUser'
import { Connection } from '../misc/Connection'
import { createResolver } from '../misc/createResolver'
import * as t from 'io-ts'
import { taskEither } from 'fp-ts'
import { IdInput } from '../misc/Types'
import { pipe } from 'fp-ts/function'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import { Resolvers } from '../assignResolvers'

// const clientNameResolver = createResolver<Client>(
//   EmptyObject,
//   NonEmptyString,
//   client => taskEither.right(getClientName(client))
// )

// const clientUserResolver = createResolver<Client>(EmptyObject, User, client =>
//   getClientUser(client)
// )

// const userClientsResolver = createResolver<DatabaseUser>(
//   ConnectionQueryArgs,
//   Connection(Client),
//   (user, args) => getUserClients(user, args)
// )

const createClientResolver = createResolver(
  {
    body: ClientCreationInput,
    output: Client
  },
  ({ body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createClient(body, user))
    )
)

const updateClientResolver = createResolver(
  {
    params: IdInput,
    body: ClientUpdateInput,
    output: Client
  },
  ({ params: { id }, body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateClient(id, body, user))
    )
)

const deleteClientResolver = createResolver(
  {
    params: IdInput,
    output: Client
  },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteClient(id, user))
    )
)

const getClientResolver = createResolver(
  {
    params: IdInput,
    output: Client
  },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getClient(id, user))
    )
)

export const ClientConnectionQuerysArgs = t.intersection(
  [
    ConnectionQueryArgs,
    t.type({
      name: optionFromNullable(NonEmptyString)
    })
  ],
  'ClientConnectionQuerysArgs'
)
export type ClientConnectionQuerysArgs = t.TypeOf<
  typeof ClientConnectionQuerysArgs
>

const getClientsResolver = createResolver(
  {
    query: ClientConnectionQuerysArgs,
    output: Connection(Client)
  },
  ({ query }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listClients(query, user))
    )
)

// const resolvers = {
//   Client: {
//     name: clientNameResolver,
//     user: clientUserResolver
//   },
//   User: {
//     clients: userClientsResolver
//   },
//   Mutation: {
//     createClient: createClientMutation,
//     updateClient: updateClientMutation,
//     deleteClient: deleteClientMutation
//   },
//   Query: {
//     client: clientQuery,
//     clients: clientsQuery
//   }
// }

const resolvers: Resolvers = {
  path: '/clients',
  POST: {
    '/': createClientResolver
  },
  PUT: {
    '/:id': updateClientResolver
  },
  DELETE: {
    '/:id': deleteClientResolver
  },
  GET: {
    '/:id': getClientResolver,
    '/': getClientsResolver
  }
}

export default resolvers
