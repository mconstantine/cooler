import { GraphQLFieldResolver } from 'graphql'
import { Project } from './Project'
import { createProject, listProjects, updateProject, deleteProject } from './model'
import { getDatabase } from '../misc/getDatabase'
import { Client } from '../client/Client'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'

interface ProjectResolvers {
  Project: {
    client: GraphQLFieldResolver<Project, any>
    tasks: GraphQLFieldResolver<Project, ConnectionQueryArgs>
  }
  Mutation: {
    createProject: GraphQLFieldResolver<any, { project: Partial<Project> }>
    updateProject: GraphQLFieldResolver<any, { id: number, project: Partial<Project> }>
    deleteProject: GraphQLFieldResolver<any, { id: number }>
  }
  Query: {
    project: GraphQLFieldResolver<any, { id: number }>
    projects: GraphQLFieldResolver<any, ConnectionQueryArgs & { name?: string }>
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
    createProject: (_parent, { project }) => {
      return createProject(project)
    },
    updateProject: (_parent, { id, project }) => {
      return updateProject(id, project)
    },
    deleteProject: (_parent, { id }) => {
      return deleteProject(id)
    }
  },
  Query: {
    project: async (_parent, { id }) => {
      const db = await getDatabase()
      return await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${id}`)
    },
    projects: (_parent, args) => {
      return listProjects(args)
    }
  }
} as ProjectResolvers
