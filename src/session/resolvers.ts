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
  Task: {
    sessions: GraphQLFieldResolver<Task, UserContext, ConnectionQueryArgs>
  }
  Mutation: {
    startSession: GraphQLFieldResolver<any, UserContext, { task: number }>
    stopSession: GraphQLFieldResolver<any, UserContext, { id: number }>
    deleteSession: GraphQLFieldResolver<any, UserContext, { id: number }>
    updateSession: GraphQLFieldResolver<
      any, UserContext, { id: number, session: Pick<Session, 'start_time' | 'end_time'> }
    >
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
  Task: {
    sessions: async (task, args, context) => {
      const sessions = await listSessions({ ...args, task: task.id }, context.user!)
      return sessions.all
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
    updateSession: (_parent, { id, session: { start_time, end_time } }, context) => {
      ensureUser(context)

      return updateSession(id, {
        ...(start_time ? { start_time: toSQLDate(new Date(start_time)) } : {}),
        ...(end_time ? { end_time: toSQLDate(new Date(end_time)) } : {})
      }, context.user!)
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
