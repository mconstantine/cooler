import userResolvers from './user/resolvers'
import clientResolvers from './client/resolvers'
import projectResolvers from './project/resolvers'
import taskResolvers from './task/resolvers'
import sessionResolvers from './session/resolvers'
import taxResolvers from './tax/resolvers'
import { merge } from './misc/merge'
import { GraphQLScalarType } from 'graphql'
import a18n from 'a18n'

const defaultResolvers = {
  Node: { __resolveType: () => 'Node' },
  TrackedNode: { __resolveType: () => 'TrackedNode' },
  Edge: { __resolveType: () => 'Edge' },
  Connection: { __resolveType: () => 'Connection' },
  Date: new GraphQLScalarType({
    name: 'Date',
    description: a18n`Represents a JavaScript date`
  })
}

export const resolvers = [
  defaultResolvers,
  userResolvers,
  clientResolvers,
  projectResolvers,
  taskResolvers,
  sessionResolvers,
  taxResolvers
].reduce((res, resolvers) => merge(res, resolvers), {})
