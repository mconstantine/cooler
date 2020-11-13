import { Client, ClientCreationInput, ClientUpdateInput } from './interface'
import {
  createClient,
  listClients,
  updateClient,
  deleteClient,
  getClient,
  getClientName,
  getClientUser,
  getUserClients
} from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { ensureUser } from '../misc/ensureUser'
import { User, DatabaseUser } from '../user/interface'
import { Connection } from '../misc/Connection'
import { createResolver } from '../misc/createResolver'
import * as t from 'io-ts'
import { taskEither } from 'fp-ts'
import { EmptyObject, PositiveInteger } from '../misc/Types'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { createSubscription, createSubscriptions } from '../misc/pubsub'

const clientNameResolver = createResolver<Client>(
  EmptyObject,
  NonEmptyString,
  client => taskEither.right(getClientName(client))
)

const clientUserResolver = createResolver<Client>(EmptyObject, User, client =>
  getClientUser(client)
)

const userClientsResolver = createResolver<DatabaseUser>(
  ConnectionQueryArgs,
  Connection(Client),
  (user, args) => getUserClients(user, args)
)

const CreatedClientSubscriptionInput = t.type(
  {
    createdClient: Client
  },
  'CreatedClientSubscriptionInput'
)
type CreatedClientSubscriptionInput = t.TypeOf<
  typeof CreatedClientSubscriptionInput
>

const createdClient = createSubscription(
  CreatedClientSubscriptionInput,
  Client,
  'CLIENT_CREATED',
  (_, { createdClient }, context) =>
    taskEither.right(createdClient.user === context.user.id)
)

const clientSubscription = createSubscriptions({
  createdClient
})

const CreateClientMutationInput = t.type(
  {
    client: ClientCreationInput
  },
  'CreateClientMutationInput'
)
const createClientMutation = createResolver(
  CreateClientMutationInput,
  Client,
  (_parent, { client }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createClient({ ...client }, user)),
      taskEither.map(client => createdClient.publish(client))
    )
)

const UpdateClientMutationInput = t.type(
  {
    id: PositiveInteger,
    client: ClientUpdateInput
  },
  'UpdateClientMutationInput'
)
const updateClientMutation = createResolver(
  UpdateClientMutationInput,
  Client,
  (_parent, { id, client }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateClient(id, client, user))
    )
)

const DeleteClientMutationInput = t.type(
  {
    id: PositiveInteger
  },
  'DeleteClientMutationInput'
)
const deleteClientMutation = createResolver(
  DeleteClientMutationInput,
  Client,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteClient(id, user))
    )
)

const ClientQueryInput = t.type(
  {
    id: PositiveInteger
  },
  'ClientQueryInput'
)
const clientQuery = createResolver(
  ClientQueryInput,
  Client,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getClient(id, user))
    )
)

export const ClientConnectionQuerysArgs = t.intersection(
  [
    ConnectionQueryArgs,
    t.partial({
      name: NonEmptyString
    })
  ],
  'ClientConnectionQuerysArgs'
)
export type ClientConnectionQuerysArgs = t.TypeOf<
  typeof ClientConnectionQuerysArgs
>
const clientsQuery = createResolver(
  ClientConnectionQuerysArgs,
  Connection(Client),
  (_parent, args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listClients(args, user))
    )
)

const resolvers = {
  Client: {
    name: clientNameResolver,
    user: clientUserResolver
  },
  User: {
    clients: userClientsResolver
  },
  Mutation: {
    createClient: createClientMutation,
    updateClient: updateClientMutation,
    deleteClient: deleteClientMutation
  },
  Query: {
    client: clientQuery,
    clients: clientsQuery
  },
  Subscription: clientSubscription
}

export default resolvers
