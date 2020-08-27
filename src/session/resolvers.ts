import { GraphQLFieldResolver } from 'graphql'
import { Session } from './Session'
import { UserContext, User } from '../user/User'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { getDatabase } from '../misc/getDatabase'
import { Task } from '../task/Task'
import SQL from 'sql-template-strings'
import { ensureUser } from '../misc/ensureUser'
import { createSession, updateSession, deleteSession, getSession, listSessions } from './model'
import { toSQLDate } from '../misc/dbUtils'
import { Project } from '../project/Project'

interface SessionResolvers {
  Session: {
    task: GraphQLFieldResolver<Session, any>
  }
  Task: {
    sessions: GraphQLFieldResolver<Task, UserContext, ConnectionQueryArgs>
    actualWorkingHours: GraphQLFieldResolver<Task, UserContext>
  }
  Project: {
    expectedWorkingHours: GraphQLFieldResolver<Project, UserContext>
    actualWorkingHours: GraphQLFieldResolver<Project, UserContext>
  }
  User: {
    openSession: GraphQLFieldResolver<User, UserContext>
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
      return await listSessions({ ...args, task: task.id }, context.user!)
    },
    actualWorkingHours: async task => {
      const db = await getDatabase()

      const { actualWorkingHours } = (await db.get<{ actualWorkingHours: number }>(SQL`
        SELECT SUM(
          (strftime('%s', end_time) - strftime('%s', start_time)) / 3600.0
        ) AS actualWorkingHours
        FROM session
        WHERE task = ${task.id} AND end_time IS NOT NULL
      `))!

      return actualWorkingHours || 0
    }
  },
  Project: {
    expectedWorkingHours: async project => {
      const db = await getDatabase()

      const { expectedWorkingHours } = (await db.get<{ expectedWorkingHours: number }>(SQL`
        SELECT SUM(task.expectedWorkingHours) AS expectedWorkingHours
        FROM task
        WHERE project = ${project.id}
      `))!

      return expectedWorkingHours
    },
    actualWorkingHours: async project => {
      const db = await getDatabase()

      const { actualWorkingHours } = (await db.get<{ actualWorkingHours: number }>(SQL`
        SELECT SUM(
          (strftime('%s', end_time) - strftime('%s', start_time)) / 3600.0
        ) AS actualWorkingHours
        FROM session
        JOIN task ON task.id = session.task
        WHERE task.project = ${project.id} AND session.end_time IS NOT NULL
      `))!

      return actualWorkingHours || 0
    }
  },
  User: {
    openSession: async user => {
      const db = await getDatabase()

      const openSession = await db.get(SQL`
        SELECT session.*
        FROM session
        JOIN task ON task.id = session.task
        JOIN project ON project.id = task.project
        JOIN client ON client.id = project.client
        WHERE client.user = ${user.id} AND session.end_time IS NULL
      `)

      return openSession || null
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
