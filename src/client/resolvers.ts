import { GraphQLFieldResolver } from 'graphql'
import {
  Client,
  ClientCreationInput,
  ClientFromDatabase,
  ClientUpdateInput
} from './interface'
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
import { Context, User, UserFromDatabase } from '../user/interface'
import { Connection } from '../misc/Connection'
import { PubSub } from 'apollo-server-express'
import {
  publish,
  Subscription,
  SubscriptionImplementation
} from '../misc/Types'

const pubsub = new PubSub()
const CLIENT_CREATED = 'CLIENT_CREATED'

type ClientNameResolver = GraphQLFieldResolver<ClientFromDatabase, Context>

const clientNameResolver: ClientNameResolver = (client): string => {
  return getClientName(client)
}

type ClientUserResolver = GraphQLFieldResolver<ClientFromDatabase, Context>

const clientUserResolver: ClientUserResolver = async (
  client
): Promise<User> => {
  return getClientUser(client)
}

type UserClientsResolver = GraphQLFieldResolver<
  UserFromDatabase,
  ConnectionQueryArgs
>

const userClientsResolver: UserClientsResolver = (
  user,
  args
): Promise<Connection<Client>> => {
  return getUserClients(user, args)
}

type CreateClientMutation = GraphQLFieldResolver<
  any,
  Context,
  { client: ClientCreationInput }
>

interface ClientSubscription extends Subscription<Client> {
  createdClient: SubscriptionImplementation<Client>
}

const createClientMutation: CreateClientMutation = async (
  _parent,
  { client },
  context
): Promise<Client | null> => {
  const res = await createClient({ ...client }, ensureUser(context))

  res &&
    publish<Client, ClientSubscription>(pubsub, CLIENT_CREATED, {
      createdClient: res
    })

  return res
}

type UpdateClientMutation = GraphQLFieldResolver<
  any,
  Context,
  {
    id: number
    client: ClientUpdateInput
  }
>

const updateClientMutation: UpdateClientMutation = (
  _parent,
  { id, client },
  context
): Promise<Client | null> => {
  return updateClient(id, client, ensureUser(context))
}

type DeleteClientMutation = GraphQLFieldResolver<any, Context, { id: number }>

const deleteClientMutation: DeleteClientMutation = (
  _parent,
  { id },
  context
): Promise<Client | null> => {
  return deleteClient(id, ensureUser(context))
}

type ClientQuery = GraphQLFieldResolver<any, Context, { id: number }>

const clientQuery: ClientQuery = async (
  _parent,
  { id },
  context
): Promise<Client | null> => {
  return await getClient(id, ensureUser(context))
}

type ClientsQuery = GraphQLFieldResolver<
  any,
  Context,
  ConnectionQueryArgs & { name?: string }
>

const clientsQuery: ClientsQuery = async (
  _parent,
  args,
  context
): Promise<Connection<Client>> => {
  return listClients(args, ensureUser(context))
}

interface ClientResolvers {
  Client: {
    name: ClientNameResolver
    user: ClientUserResolver
  }
  User: {
    clients: UserClientsResolver
  }
  Mutation: {
    createClient: CreateClientMutation
    updateClient: UpdateClientMutation
    deleteClient: DeleteClientMutation
  }
  Query: {
    client: ClientQuery
    clients: ClientsQuery
  }
  Subscription: ClientSubscription
}

const resolvers: ClientResolvers = {
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
  Subscription: {
    createdClient: {
      subscribe: () => pubsub.asyncIterator([CLIENT_CREATED])
    }
  }
}

export default resolvers
