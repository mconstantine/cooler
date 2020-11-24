import {
  DatabaseProject,
  Project,
  ProjectCreationInput,
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
import { Client, DatabaseClient } from '../client/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { DatabaseUser } from '../user/interface'
import { ensureUser } from '../misc/ensureUser'
import { Connection } from '../misc/Connection'
import * as t from 'io-ts'
import { taskEither } from 'fp-ts'
import { createResolver } from '../misc/createResolver'
import { EmptyObject, NonNegativeNumber, PositiveInteger } from '../misc/Types'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import { pipe } from 'fp-ts/function'

const projectClientResolver = createResolver<DatabaseProject>(
  EmptyObject,
  Client,
  project => getProjectClient(project)
)

const clientProjectsResolver = createResolver<DatabaseClient>(
  ConnectionQueryArgs,
  Connection(Project),
  (client, args) => getClientProjects(client, args)
)

const userProjectsResolver = createResolver<DatabaseUser>(
  ConnectionQueryArgs,
  Connection(Project),
  (user, args) => getUserProjects(user, args)
)

const UserCashedBalanceResolverInput = t.type(
  {
    since: optionFromNullable(DateFromISOString)
  },
  'UserCashedBalanceResolverInput'
)
const userCashedBalanceResolver = createResolver<DatabaseUser>(
  UserCashedBalanceResolverInput,
  NonNegativeNumber,
  (user, { since }) => getUserCashedBalance(user, since)
)

const CreateProjectMutationInput = t.type(
  {
    project: ProjectCreationInput
  },
  'CreateProjectMutationInput'
)
const createProjectMutation = createResolver(
  CreateProjectMutationInput,
  Project,
  (_parent, { project }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createProject(project, user))
    )
)

const UpdateProjectMutationInput = t.type(
  {
    id: PositiveInteger,
    project: ProjectUpdateInput
  },
  'UpdateProjectMutationInput'
)
const updateProjectMutation = createResolver(
  UpdateProjectMutationInput,
  Project,
  (_parent, { id, project }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateProject(id, project, user))
    )
)

const DeleteProjectMutationInput = t.type(
  {
    id: PositiveInteger
  },
  'DeleteProjectMutationInput'
)
const deleteProjectMutation = createResolver(
  DeleteProjectMutationInput,
  Project,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteProject(id, user))
    )
)

const ProjectQueryInput = t.type(
  {
    id: PositiveInteger
  },
  'ProjectQueryInput'
)
const projectQuery = createResolver(
  ProjectQueryInput,
  Project,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getProject(id, user))
    )
)

export const ProjectConnectionQueryArgs = t.intersection(
  [
    ConnectionQueryArgs,
    t.type({
      name: optionFromNullable(NonEmptyString)
    })
  ],
  'ProjectConnectionQueryArgs'
)
export type ProjectConnectionQueryArgs = t.TypeOf<
  typeof ProjectConnectionQueryArgs
>
const projectsQuery = createResolver(
  ProjectConnectionQueryArgs,
  Connection(Project),
  (_parent, args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listProjects(args, user))
    )
)

const resolvers = {
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
