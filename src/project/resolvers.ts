import { GraphQLFieldResolver } from 'graphql'
import {
  ProjectCreationInput,
  ProjectFromDatabase,
  ProjectUpdateInput
} from './interface'
import {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  getProject,
  getProjectClient,
  getUserProjects,
  getUserCashedBalance,
  getClientProjects
} from './model'
import { ClientFromDatabase } from '../client/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { UserContext, UserFromDatabase } from '../user/interface'
import { ensureUser } from '../misc/ensureUser'
import { DateString } from '../misc/Types'

type ProjectClientResolver = GraphQLFieldResolver<ProjectFromDatabase, any>

const projectClientResolver: ProjectClientResolver = project => {
  return getProjectClient(project)
}

type ClientProjectsResolver = GraphQLFieldResolver<
  ClientFromDatabase,
  any,
  ConnectionQueryArgs
>

const clientProjectsResolver: ClientProjectsResolver = (
  client,
  args,
  _context
) => {
  return getClientProjects(client, args)
}

type UserProjectsResolver = GraphQLFieldResolver<
  UserFromDatabase,
  any,
  ConnectionQueryArgs
>

const userProjectsResolver: UserProjectsResolver = (user, args) => {
  return getUserProjects(user, args)
}

type UserCashedBalanceResolver = GraphQLFieldResolver<
  UserFromDatabase,
  any,
  { since?: DateString }
>

const userCashedBalanceResolver: UserCashedBalanceResolver = async (
  user,
  { since }
) => {
  return getUserCashedBalance(user, since)
}

type CreateProjectMutation = GraphQLFieldResolver<
  any,
  UserContext,
  { project: ProjectCreationInput }
>

const createProjectMutation: CreateProjectMutation = (
  _parent,
  { project },
  context
) => {
  return createProject(project, ensureUser(context))
}

type UpdateProjectMutation = GraphQLFieldResolver<
  any,
  UserContext,
  { id: number; project: ProjectUpdateInput }
>

const updateProjectMutation: UpdateProjectMutation = (
  _parent,
  { id, project },
  context
) => {
  return updateProject(id, project, ensureUser(context))
}

type DeleteProjectMutation = GraphQLFieldResolver<
  any,
  UserContext,
  { id: number }
>

const deleteProjectMutation: DeleteProjectMutation = (
  _parent,
  { id },
  context
) => {
  return deleteProject(id, ensureUser(context))
}

type ProjectQuery = GraphQLFieldResolver<any, UserContext, { id: number }>

const projectQuery: ProjectQuery = async (_parent, { id }, context) => {
  return getProject(id, ensureUser(context))
}

type ProjectsQuery = GraphQLFieldResolver<
  any,
  UserContext,
  ConnectionQueryArgs & { name?: string }
>

const projectsQuery: ProjectsQuery = (_parent, args, context) => {
  return listProjects(args, ensureUser(context))
}

interface ProjectResolvers {
  Project: {
    client: ProjectClientResolver
  }
  User: {
    projects: UserProjectsResolver
    cashedBalance: UserCashedBalanceResolver
  }
  Client: {
    projects: ClientProjectsResolver
  }
  Mutation: {
    createProject: CreateProjectMutation
    updateProject: UpdateProjectMutation
    deleteProject: DeleteProjectMutation
  }
  Query: {
    project: ProjectQuery
    projects: ProjectsQuery
  }
}

const resolvers: ProjectResolvers = {
  Project: {
    client: projectClientResolver
  },
  User: {
    projects: userProjectsResolver,
    cashedBalance: userCashedBalanceResolver
  },
  Client: {
    projects: clientProjectsResolver
  },
  Mutation: {
    createProject: createProjectMutation,
    updateProject: updateProjectMutation,
    deleteProject: deleteProjectMutation
  },
  Query: {
    project: projectQuery,
    projects: projectsQuery
  }
}

export default resolvers
