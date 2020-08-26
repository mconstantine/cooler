import { GraphQLFieldResolver } from 'graphql'
import { Project } from './Project'
import { createProject, listProjects, updateProject, deleteProject, getProject } from './model'
import { getDatabase } from '../misc/getDatabase'
import { Client } from '../client/Client'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { UserContext } from '../user/User'
import { ensureUser } from '../misc/ensureUser'

interface ProjectResolvers {
  Project: {
    client: GraphQLFieldResolver<Project, any>
    tasks: GraphQLFieldResolver<Project, ConnectionQueryArgs>
  }
  Mutation: {
    createProject: GraphQLFieldResolver<any, UserContext, { project: Partial<Project> }>
    updateProject: GraphQLFieldResolver<any, UserContext, { id: number, project: Partial<Project> }>
    deleteProject: GraphQLFieldResolver<any, UserContext, { id: number }>
  }
  Query: {
    project: GraphQLFieldResolver<any, UserContext, { id: number }>
    projects: GraphQLFieldResolver<any, UserContext, ConnectionQueryArgs & { name?: string }>
  }
}

export default {
  Project: {
    client: async project => {
      const db = await getDatabase()
      return await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${project.client}`)
    },
    tasks: (project, args) => {
      return queryToConnection(args, ['*'], 'task', SQL`WHERE project = ${project.id}`)
    }
  },
  Mutation: {
    createProject: (_parent, { project }, context) => {
      ensureUser(context)
      return createProject(project, context.user!)
    },
    updateProject: (_parent, { id, project }, context) => {
      ensureUser(context)
      return updateProject(id, project, context.user!)
    },
    deleteProject: (_parent, { id }, context) => {
      ensureUser(context)
      return deleteProject(id, context.user!)
    }
  },
  Query: {
    project: async (_parent, { id }, context) => {
      ensureUser(context)
      return getProject(id, context.user!)
    },
    projects: (_parent, args, context) => {
      ensureUser(context)
      return listProjects(args, context.user!)
    }
  }
} as ProjectResolvers
