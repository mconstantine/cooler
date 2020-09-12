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
import { UserContext, User, UserFromDatabase } from '../user/interface'
import { Connection } from '../misc/Connection'

type ClientNameResolver = GraphQLFieldResolver<ClientFromDatabase, UserContext>

const clientNameResolver: ClientNameResolver = (client): string => {
  return getClientName(client)
}

type ClientUserResolver = GraphQLFieldResolver<ClientFromDatabase, UserContext>

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
  UserContext,
  { client: ClientCreationInput }
>

const createClientMutation: CreateClientMutation = (
  _parent,
  { client },
  context
): Promise<Client | null> => {
  return createClient({ ...client }, ensureUser(context))
}

type UpdateClientMutation = GraphQLFieldResolver<
  any,
  UserContext,
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

type DeleteClientMutation = GraphQLFieldResolver<
  any,
  UserContext,
  { id: number }
>

const deleteClientMutation: DeleteClientMutation = (
  _parent,
  { id },
  context
): Promise<Client | null> => {
  return deleteClient(id, ensureUser(context))
}

type ClientQuery = GraphQLFieldResolver<any, UserContext, { id: number }>

const clientQuery: ClientQuery = async (
  _parent,
  { id },
  context
): Promise<Client | null> => {
  return await getClient(id, ensureUser(context))
}

type ClientsQuery = GraphQLFieldResolver<
  any,
  UserContext,
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
  }
}

export default resolvers
