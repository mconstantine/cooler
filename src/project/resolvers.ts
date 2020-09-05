import { GraphQLFieldResolver } from 'graphql'
import { Project } from './Project'
import { createProject, listProjects, updateProject, deleteProject, getProject } from './model'
import { getDatabase } from '../misc/getDatabase'
import { Client } from '../client/Client'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { UserContext, User } from '../user/User'
import { ensureUser } from '../misc/ensureUser'
import { toSQLDate } from '../misc/dbUtils'

interface ProjectResolvers {
  Project: {
    client: GraphQLFieldResolver<Project, any>
  }
  User: {
    projects: GraphQLFieldResolver<User, ConnectionQueryArgs>
    cashedBalance: GraphQLFieldResolver<User, { since?: string }>
  }
  Client: {
    projects: GraphQLFieldResolver<Client, ConnectionQueryArgs>
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
    }
  },
  User: {
    projects: (user, args) => {
      return queryToConnection(args, ['project.*'], 'client', SQL`
        JOIN project ON project.client = client.id
        WHERE client.user = ${user.id}
      `)
    },
    cashedBalance: async (user, { since }) => {
      const db = await getDatabase()
      const sql = SQL`
        SELECT IFNULL(SUM(project.cashed_balance), 0) AS balance
        FROM project
        JOIN client ON client.id = project.client
        WHERE client.user = ${user.id} AND project.cashed_balance IS NOT NULL
      `

      since && sql.append(SQL` AND project.cashed_at >= ${toSQLDate(new Date(since))}`)

      const { balance } = (await db.get<{ balance: number }>(sql))!
      return balance
    }
  },
  Client: {
    projects: (client, args, _context) => {
      return queryToConnection(args, ['*'], 'project', SQL`WHERE client = ${client.id}`)
    }
  },
  Mutation: {
    createProject: (_parent, { project }, context) => {
      ensureUser(context)
      return createProject(project, context.user!)
    },
    updateProject: (_parent, { id, project }, context) => {
      ensureUser(context)
      return updateProject(id, {
        ...project,
        cashed_at: project.cashed_at ? toSQLDate(new Date(project.cashed_at)) : project.cashed_at
      }, context.user!)
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
