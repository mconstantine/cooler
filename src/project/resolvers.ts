import { GraphQLFieldResolver } from 'graphql'
import {
  Project,
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
import { Client, ClientFromDatabase } from '../client/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { Context, UserContext, UserFromDatabase } from '../user/interface'
import { ensureUser } from '../misc/ensureUser'
import {
  publish,
  Subscription,
  SubscriptionImplementation,
  WithFilter
} from '../misc/pubsub'
import { Connection } from '../misc/Connection'
import { withFilter } from 'apollo-server-express'
import { pubsub } from '../pubsub'
import { SQLDate } from '../misc/Types'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { definitely } from '../misc/definitely'

const PROJECT_CREATED = 'PROJECT_CREATED'

type ProjectClientResolver = GraphQLFieldResolver<ProjectFromDatabase, any>

const projectClientResolver: ProjectClientResolver = (
  project
): Promise<Client | null> => {
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
): Promise<Connection<Project>> => {
  return getClientProjects(client, args)
}

type UserProjectsResolver = GraphQLFieldResolver<
  UserFromDatabase,
  any,
  ConnectionQueryArgs
>

const userProjectsResolver: UserProjectsResolver = (
  user,
  args
): Promise<Connection<Project>> => {
  return getUserProjects(user, args)
}

type UserCashedBalanceResolver = GraphQLFieldResolver<
  UserFromDatabase,
  any,
  { since?: SQLDate }
>

const userCashedBalanceResolver: UserCashedBalanceResolver = async (
  user,
  { since }
): Promise<number> => {
  return getUserCashedBalance(user, since)
}

interface ProjectSubscription extends Subscription<Project> {
  createdProject: SubscriptionImplementation<Project>
}

const projectSubscription: ProjectSubscription = {
  createdProject: {
    subscribe: withFilter(
      () => pubsub.asyncIterator([PROJECT_CREATED]),
      (async ({ createdProject }, { client }, context) => {
        const db = await getDatabase()
        const { user } = definitely(
          await db.get<{ user: number }>(SQL`
        SELECT client.user
        FROM project
        JOIN client ON client.id = project.client
        WHERE project.id = ${createdProject.id}
      `)
        )

        if (user !== context.user.id) {
          return false
        }

        return !client || client === createdProject.client
      }) as WithFilter<
        { client: number | null },
        ProjectSubscription,
        UserContext,
        Project
      >
    )
  }
}

type CreateProjectMutation = GraphQLFieldResolver<
  any,
  Context,
  { project: ProjectCreationInput }
>

const createProjectMutation: CreateProjectMutation = async (
  _parent,
  { project },
  context
): Promise<Project | null> => {
  const res = await createProject(project, ensureUser(context))

  res &&
    publish<Project, ProjectSubscription>(PROJECT_CREATED, {
      createdProject: res
    })

  return res
}

type UpdateProjectMutation = GraphQLFieldResolver<
  any,
  Context,
  { id: number; project: ProjectUpdateInput }
>

const updateProjectMutation: UpdateProjectMutation = (
  _parent,
  { id, project },
  context
): Promise<Project | null> => {
  return updateProject(id, project, ensureUser(context))
}

type DeleteProjectMutation = GraphQLFieldResolver<any, Context, { id: number }>

const deleteProjectMutation: DeleteProjectMutation = (
  _parent,
  { id },
  context
): Promise<Project | null> => {
  return deleteProject(id, ensureUser(context))
}

type ProjectQuery = GraphQLFieldResolver<any, Context, { id: number }>

const projectQuery: ProjectQuery = async (
  _parent,
  { id },
  context
): Promise<Project | null> => {
  return getProject(id, ensureUser(context))
}

type ProjectsQuery = GraphQLFieldResolver<
  any,
  Context,
  ConnectionQueryArgs & { name?: string }
>

const projectsQuery: ProjectsQuery = (
  _parent,
  args,
  context
): Promise<Connection<Project>> => {
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
  Subscription: ProjectSubscription
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
  },
  Subscription: projectSubscription
}

export default resolvers
