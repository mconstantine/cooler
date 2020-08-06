import clientResolvers from './client/resolvers'
import projectResolvers from './project/resolvers'
import taskResolvers from './task/resolvers'
import { merge } from './misc/merge'

const defaultResolvers = {
  Node: { __resolveType: () => 'Node' },
  Edge: { __resolveType: () => 'Edge' },
  Connection: { __resolveType: () => 'Connection' }
}

export const resolvers = [
  defaultResolvers, clientResolvers, projectResolvers, taskResolvers
].reduce(
  (res, resolvers) => merge(res, resolvers), {}
)
