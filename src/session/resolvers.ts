import { GraphQLFieldResolver } from 'graphql'
import {
  Session,
  SessionFromDatabase,
  SessionUpdateInput,
  TimesheetCreationInput
} from './interface'
import { Context, UserContext, UserFromDatabase } from '../user/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { Task, TaskFromDatabase } from '../task/interface'
import { ensureUser } from '../misc/ensureUser'
import {
  startSession,
  updateSession,
  deleteSession,
  getSession,
  listSessions,
  createTimesheet,
  getSessionTask,
  getTaskSessions,
  getTaskActualWorkingHours,
  getTaskBudget,
  getTaskBalance,
  getProjectExpectedWorkingHours,
  getProjectActualWorkingHours,
  getProjectBudget,
  getProjectBalance,
  getUserOpenSessions,
  getUserExpectedWorkingHours,
  getUserActualWorkingHours,
  getUserBudget,
  getUserBalance,
  stopSession
} from './model'
import { ProjectFromDatabase } from '../project/interface'
import { SQLDate } from '../misc/Types'
import { Connection } from '../misc/Connection'
import {
  publish,
  Subscription,
  SubscriptionImplementation,
  WithFilter
} from '../misc/pubsub'
import { withFilter } from 'apollo-server-express'
import { pubsub } from '../pubsub'
import { definitely } from '../misc/definitely'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'

const SESSION_STARTED = 'SESSION_STARTED'
const SESSION_STOPPED = 'SESSION_STOPPED'

export interface SinceArg {
  since?: SQLDate
}

type SessionTaskResolver = GraphQLFieldResolver<SessionFromDatabase, any>

const sessionTaskResolver: SessionTaskResolver = (session): Promise<Task> => {
  return getSessionTask(session)
}

type TaskSessionsResolver = GraphQLFieldResolver<
  TaskFromDatabase,
  Context,
  ConnectionQueryArgs
>

const taskSessionsResolver: TaskSessionsResolver = (
  task,
  args,
  context
): Promise<Connection<Session>> => {
  return getTaskSessions(task, args, ensureUser(context))
}

type TaskActualWorkingHoursResolver = GraphQLFieldResolver<
  TaskFromDatabase,
  Context
>

const taskActualWorkingHoursResolver: TaskActualWorkingHoursResolver = (
  task
): Promise<number> => {
  return getTaskActualWorkingHours(task)
}

type TaskBudgetResolver = GraphQLFieldResolver<TaskFromDatabase, Context>

const taskBudgetResolver: TaskBudgetResolver = (task): Promise<number> => {
  return getTaskBudget(task)
}

type TaskBalanceResolver = GraphQLFieldResolver<TaskFromDatabase, Context>

const taskBalanceResolver: TaskBalanceResolver = (task): Promise<number> => {
  return getTaskBalance(task)
}

type ProjectExpectedWorkingHoursResolver = GraphQLFieldResolver<
  ProjectFromDatabase,
  Context
>

const projectExpectedWorkingHoursResolver: ProjectExpectedWorkingHoursResolver = (
  project
): Promise<number> => {
  return getProjectExpectedWorkingHours(project)
}

type ProjectActualWorkingHoursResolver = GraphQLFieldResolver<
  ProjectFromDatabase,
  Context
>

const projectActualWorkingHoursResolver: ProjectActualWorkingHoursResolver = (
  project
): Promise<number> => {
  return getProjectActualWorkingHours(project)
}

type ProjectBudgetResolver = GraphQLFieldResolver<ProjectFromDatabase, Context>

const projectBudgetResolver: ProjectBudgetResolver = project => {
  return getProjectBudget(project)
}

type ProjectBalanceResolver = GraphQLFieldResolver<ProjectFromDatabase, Context>

const projectBalanceResolver: ProjectBalanceResolver = (
  project
): Promise<number> => {
  return getProjectBalance(project)
}

type UserOpenSessionsResolver = GraphQLFieldResolver<
  UserFromDatabase,
  Context,
  ConnectionQueryArgs
>

const userOpenSessionsResolver: UserOpenSessionsResolver = (
  user,
  args
): Promise<Connection<Session>> => {
  return getUserOpenSessions(user, args)
}

type UserExpectedWorkingHoursResolver = GraphQLFieldResolver<
  UserFromDatabase,
  Context,
  SinceArg
>

const userExpectedWorkingHoursResolver: UserExpectedWorkingHoursResolver = (
  user,
  args
): Promise<number> => {
  return getUserExpectedWorkingHours(user, args)
}

type UserActualWorkingHoursResolver = GraphQLFieldResolver<
  UserFromDatabase,
  Context,
  SinceArg
>

const userActualWorkingHoursResolver: UserActualWorkingHoursResolver = (
  user,
  args
): Promise<number> => {
  return getUserActualWorkingHours(user, args)
}

type UserBudgetResolver = GraphQLFieldResolver<
  UserFromDatabase,
  Context,
  SinceArg
>

const userBudgetResolver: UserBudgetResolver = (
  user,
  args
): Promise<number> => {
  return getUserBudget(user, args)
}

type UserBalanceResolver = GraphQLFieldResolver<
  UserFromDatabase,
  Context,
  SinceArg
>

const userBalanceResolver: UserBalanceResolver = (
  user,
  args
): Promise<number> => {
  return getUserBalance(user, args)
}

interface SessionSubscription extends Subscription<Session> {
  startedSession: SubscriptionImplementation<Session>
  stoppedSession: SubscriptionImplementation<Session>
}

const sessionSubscription: SessionSubscription = {
  startedSession: {
    subscribe: withFilter(
      () => pubsub.asyncIterator([SESSION_STARTED]),
      (async (
        { startedSession },
        { project: targetProject, task: targetTask },
        context
      ) => {
        const db = await getDatabase()

        const { user, project } = definitely(
          await db.get(SQL`
            SELECT client.user, project.id AS project
            FROM session
            JOIN task ON task.id = session.task
            JOIN project ON project.id = task.project
            JOIN client ON client.id = project.client
            WHERE session.id = ${startedSession.id}
          `)
        )

        if (user !== context.user.id) {
          return false
        }

        const isSameProject = !targetProject || targetProject === project
        const isSameTask = !targetTask || targetTask === startedSession.task

        return isSameProject && isSameTask
      }) as WithFilter<
        { project: number | null; task: number | null },
        SessionSubscription,
        UserContext,
        Session
      >
    )
  },
  stoppedSession: {
    subscribe: withFilter(
      () => pubsub.asyncIterator([SESSION_STOPPED]),
      (async (
        { stoppedSession },
        { project: targetProject, task: targetTask },
        context
      ) => {
        const db = await getDatabase()

        const { user, project } = definitely(
          await db.get(SQL`
            SELECT client.user, project.id AS project
            FROM session
            JOIN task ON task.id = session.task
            JOIN project ON project.id = task.project
            JOIN client ON client.id = project.client
            WHERE session.id = ${stoppedSession.id}
          `)
        )

        if (user !== context.user.id) {
          return false
        }

        const isSameProject = !targetProject || targetProject === project
        const isSameTask = !targetTask || targetTask === stoppedSession.task

        return isSameProject && isSameTask
      }) as WithFilter<
        { project: number | null; task: number | null },
        SessionSubscription,
        UserContext,
        Session
      >
    )
  }
}

type StartSessionMutation = GraphQLFieldResolver<any, Context, { task: number }>

const startSessionMutation: StartSessionMutation = async (
  _parent,
  { task },
  context
): Promise<Session | null> => {
  const res = await startSession(task, ensureUser(context))

  res &&
    publish<Session, SessionSubscription>(SESSION_STARTED, {
      startedSession: res
    })

  return res
}

type StopSessionMutation = GraphQLFieldResolver<any, Context, { id: number }>

const stopSessionMutation: StopSessionMutation = async (
  _parent,
  { id },
  context
): Promise<Session | null> => {
  const res = await stopSession(id, ensureUser(context))

  res &&
    publish<Session, SessionSubscription>(SESSION_STOPPED, {
      stoppedSession: res
    })

  return res
}

type UpdateSessionMutation = GraphQLFieldResolver<
  any,
  Context,
  { id: number; session: SessionUpdateInput }
>

const updateSessionMutation: UpdateSessionMutation = (
  _parent,
  { id, session },
  context
): Promise<Session | null> => {
  return updateSession(id, session, ensureUser(context))
}

type DeleteSessionMutation = GraphQLFieldResolver<any, Context, { id: number }>

const deleteSessionMutation: DeleteSessionMutation = (
  _parent,
  { id },
  context
): Promise<Session | null> => {
  return deleteSession(id, ensureUser(context))
}

type CreateTimesheetMutation = GraphQLFieldResolver<
  any,
  Context,
  TimesheetCreationInput
>

const createTimesheetMutation: CreateTimesheetMutation = (
  _parent,
  args,
  context
): Promise<string | null> => {
  return createTimesheet(args, ensureUser(context))
}

type SessionQuery = GraphQLFieldResolver<any, Context, { id: number }>

const sessionQuery: SessionQuery = (
  _parent,
  { id },
  context
): Promise<Session | null> => {
  return getSession(id, ensureUser(context))
}

type SessionsQuery = GraphQLFieldResolver<
  any,
  Context,
  ConnectionQueryArgs & { task?: number }
>

const sessionsQuery: SessionsQuery = (
  _parent,
  args,
  context
): Promise<Connection<Session>> => {
  return listSessions(args, ensureUser(context))
}

interface SessionResolvers {
  Session: {
    task: SessionTaskResolver
  }
  Task: {
    sessions: TaskSessionsResolver
    actualWorkingHours: TaskActualWorkingHoursResolver
    budget: TaskBudgetResolver
    balance: TaskBalanceResolver
  }
  Project: {
    expectedWorkingHours: ProjectExpectedWorkingHoursResolver
    actualWorkingHours: ProjectActualWorkingHoursResolver
    budget: ProjectBudgetResolver
    balance: ProjectBalanceResolver
  }
  User: {
    openSessions: UserOpenSessionsResolver
    expectedWorkingHours: UserExpectedWorkingHoursResolver
    actualWorkingHours: UserActualWorkingHoursResolver
    budget: UserBudgetResolver
    balance: UserBalanceResolver
  }
  Mutation: {
    startSession: StartSessionMutation
    stopSession: StopSessionMutation
    deleteSession: DeleteSessionMutation
    updateSession: UpdateSessionMutation
    createTimesheet: CreateTimesheetMutation
  }
  Query: {
    session: SessionQuery
    sessions: SessionsQuery
  }
  Subscription: SessionSubscription
}

const resolvers: SessionResolvers = {
  Session: {
    task: sessionTaskResolver
  },
  Task: {
    sessions: taskSessionsResolver,
    actualWorkingHours: taskActualWorkingHoursResolver,
    budget: taskBudgetResolver,
    balance: taskBalanceResolver
  },
  Project: {
    expectedWorkingHours: projectExpectedWorkingHoursResolver,
    actualWorkingHours: projectActualWorkingHoursResolver,
    budget: projectBudgetResolver,
    balance: projectBalanceResolver
  },
  User: {
    openSessions: userOpenSessionsResolver,
    expectedWorkingHours: userExpectedWorkingHoursResolver,
    actualWorkingHours: userActualWorkingHoursResolver,
    budget: userBudgetResolver,
    balance: userBalanceResolver
  },
  Mutation: {
    startSession: startSessionMutation,
    stopSession: stopSessionMutation,
    updateSession: updateSessionMutation,
    deleteSession: deleteSessionMutation,
    createTimesheet: createTimesheetMutation
  },
  Query: {
    session: sessionQuery,
    sessions: sessionsQuery
  },
  Subscription: sessionSubscription
}

export default resolvers
