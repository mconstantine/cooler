import { GraphQLFieldResolver } from 'graphql'
import { Project } from './Project'
import { createProject } from './model'
import { getDatabase } from '../misc/getDatabase'
import { Client } from '../client/Client'
import SQL from 'sql-template-strings'

interface ProjectResolvers {
  Project: {
    client: GraphQLFieldResolver<Project, any>
  }
  Mutation: {
    createProject: GraphQLFieldResolver<any, { project: Partial<Project> }>
  }
}

export default {
  Project: {
    client: async project => {
      const db = await getDatabase()
      return await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${project.client}`)
    }
  },
  Mutation: {
    createProject: (_parent, { project }) => {
      return createProject(project)
    }
  }
} as ProjectResolvers
