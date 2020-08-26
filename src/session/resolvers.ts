import { GraphQLFieldResolver } from 'graphql'
import { Session } from './Session'
import { UserContext } from '../user/User'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { getDatabase } from '../misc/getDatabase'
import { Task } from '../task/Task'
import SQL from 'sql-template-strings'
import { ensureUser } from '../misc/ensureUser'
import { createSession, updateSession, deleteSession, getSession, listSessions } from './model'
import { toSQLDate } from '../misc/dbUtils'

interface SessionResolvers {
  Session: {
    task: GraphQLFieldResolver<Session, any>
  }
  Mutation: {
    startSession: GraphQLFieldResolver<any, UserContext, { task: number }>
    stopSession: GraphQLFieldResolver<any, UserContext, { id: number }>
    deleteSession: GraphQLFieldResolver<any, UserContext, { id: number }>
  }
  Query: {
    session: GraphQLFieldResolver<any, UserContext, { id: number }>
    sessions: GraphQLFieldResolver<any, UserContext, ConnectionQueryArgs & { task?: number }>
  }
}

export default {
  Session: {
    task: async session => {
      const db = await getDatabase()
      return db.get<Task>(SQL`SELECT * FROM task WHERE id = ${session.task}`)
    }
  },
  Mutation: {
    startSession: (_parent, { task }, context) => {
      ensureUser(context)
      return createSession({ task }, context.user!)
    },
    stopSession: (_parent, { id }, context) => {
      ensureUser(context)
      return updateSession(id, { end_time: toSQLDate(new Date()) }, context.user!)
    },
    deleteSession: (_parent, { id }, context) => {
      ensureUser(context)
      return deleteSession(id, context.user!)
    }
  },
  Query: {
    session: (_parent, { id }, context) => {
      ensureUser(context)
      return getSession(id, context.user!)
    },
    sessions: (_parent, args, context) => {
      ensureUser(context)
      return listSessions(args, context.user!)
    }
  }
} as SessionResolvers
