import { GraphQLFieldResolver } from 'graphql'
import { Client } from './interface'
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
import { UserContext, User } from '../user/interface'
import { Connection } from '../misc/Connection'

type ClientNameResolver = GraphQLFieldResolver<Client, UserContext>

const clientNameResolver: ClientNameResolver = (client): string => {
  return getClientName(client)
}

type ClientUserResolver = GraphQLFieldResolver<Client, UserContext>

const clientUserResolver: ClientUserResolver = async (
  client
): Promise<User> => {
  return getClientUser(client)
}

type UserClientsResolver = GraphQLFieldResolver<User, ConnectionQueryArgs>

const userClientsResolver: UserClientsResolver = (
  user,
  args
): Promise<Connection<Client>> => {
  return getUserClients(user, args)
}

type CreateClientMutation = GraphQLFieldResolver<
  any,
  UserContext,
  { client: Omit<Client, 'id' | 'created_at' | 'updated_at'> }
>

const createClientMutation: CreateClientMutation = (
  _parent,
  { client },
  context
): Promise<Client | null> => {
  ensureUser(context)
  return createClient({ ...client }, context.user!)
}

type UpdateClientMutation = GraphQLFieldResolver<
  any,
  UserContext,
  {
    id: number
    client: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>
  }
>

const updateClientMutation: UpdateClientMutation = (
  _parent,
  { id, client },
  context
): Promise<Client | null> => {
  ensureUser(context)
  return updateClient(id, client, context.user!)
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
  ensureUser(context)
  return deleteClient(id, context.user!)
}

type ClientQuery = GraphQLFieldResolver<any, UserContext, { id: number }>

const clientQuery: ClientQuery = async (
  _parent,
  { id },
  context
): Promise<Client | null> => {
  ensureUser(context)
  return await getClient(id, context.user!)
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
  ensureUser(context)
  return listClients(args, context.user!)
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
