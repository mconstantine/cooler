import userResolvers from './user/resolvers'
import clientResolvers from './client/resolvers'
import projectResolvers from './project/resolvers'
import taskResolvers from './task/resolvers'
import sessionResolvers from './session/resolvers'
import taxResolvers from './tax/resolvers'
import { merge } from './misc/merge'

const defaultResolvers = {
  Node: { __resolveType: () => 'Node' },
  TrackedNode: { __resolveType: () => 'TrackedNode' },
  Edge: { __resolveType: () => 'Edge' },
  Connection: { __resolveType: () => 'Connection' }
}

export const resolvers = [
  defaultResolvers,
  userResolvers,
  clientResolvers,
  projectResolvers,
  taskResolvers,
  sessionResolvers,
  taxResolvers
].reduce(
  (res, resolvers) => merge(res, resolvers), {}
)
