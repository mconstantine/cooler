import {
  DatabaseSession,
  Session,
  SessionUpdateInput,
  TimesheetCreationInput
} from './interface'
import { DatabaseUser } from '../user/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { DatabaseTask, Task } from '../task/interface'
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
import { Connection } from '../misc/Connection'
import * as t from 'io-ts'
import { DateFromISOString, optionFromNullable } from 'io-ts-types'
import { createResolver } from '../misc/createResolver'
import { EmptyObject, PositiveInteger } from '../misc/Types'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { DatabaseProject } from '../project/interface'

export const UserDataFromSessionResolverInput = t.type(
  {
    since: optionFromNullable(DateFromISOString)
  },
  'UserDataFromSessionResolverInput'
)
export type UserDataFromSessionResolverInput = t.TypeOf<
  typeof UserDataFromSessionResolverInput
>

const sessionTaskResolver = createResolver<DatabaseSession>(
  EmptyObject,
  Task,
  getSessionTask
)

const taskSessionsResolver = createResolver<DatabaseTask>(
  ConnectionQueryArgs,
  Connection(Session),
  (task, args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getTaskSessions(task, args, user))
    )
)

const taskActualWorkingHoursResolver = createResolver<DatabaseTask>(
  EmptyObject,
  t.number,
  getTaskActualWorkingHours
)

const taskBudgetResolver = createResolver<DatabaseTask>(
  EmptyObject,
  t.number,
  getTaskBudget
)

const taskBalanceResolver = createResolver<DatabaseTask>(
  EmptyObject,
  t.number,
  getTaskBalance
)

const projectExpectedWorkingHoursResolver = createResolver(
  EmptyObject,
  t.number,
  getProjectExpectedWorkingHours
)

const projectActualWorkingHoursResolver = createResolver(
  EmptyObject,
  t.number,
  getProjectActualWorkingHours
)

const projectBudgetResolver = createResolver<DatabaseProject>(
  EmptyObject,
  t.number,
  getProjectBudget
)

const projectBalanceResolver = createResolver<DatabaseProject>(
  EmptyObject,
  t.number,
  getProjectBalance
)

const userOpenSessionsResolver = createResolver<DatabaseUser>(
  ConnectionQueryArgs,
  Connection(Session),
  getUserOpenSessions
)

const userExpectedWorkingHoursResolver = createResolver<DatabaseUser>(
  UserDataFromSessionResolverInput,
  t.number,
  getUserExpectedWorkingHours
)

const userActualWorkingHoursResolver = createResolver<DatabaseUser>(
  UserDataFromSessionResolverInput,
  t.number,
  getUserActualWorkingHours
)

const userBudgetResolver = createResolver<DatabaseUser>(
  UserDataFromSessionResolverInput,
  t.number,
  getUserBudget
)

const userBalanceResolver = createResolver<DatabaseUser>(
  UserDataFromSessionResolverInput,
  t.number,
  getUserBalance
)

const StartSessionMutationInput = t.type(
  {
    task: PositiveInteger
  },
  'StartSessionMutationInput'
)
const startSessionMutation = createResolver(
  StartSessionMutationInput,
  Session,
  (_parent, { task }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => startSession(task, user))
    )
)

const StopSessionMutationInput = t.type(
  {
    id: PositiveInteger
  },
  'StopSessionMutationInput'
)
const stopSessionMutation = createResolver(
  StopSessionMutationInput,
  Session,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => stopSession(id, user))
    )
)

const UpdateSessionMutationInput = t.type(
  { id: PositiveInteger, session: SessionUpdateInput },
  'UpdateSessionMutationInput'
)
const updateSessionMutation = createResolver(
  UpdateSessionMutationInput,
  Session,
  (_parent, { id, session }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateSession(id, session, user))
    )
)

const DeleteSessionMutationInput = t.type(
  { id: PositiveInteger },
  'DeleteSessionMutationInput'
)
const deleteSessionMutation = createResolver(
  DeleteSessionMutationInput,
  Session,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteSession(id, user))
    )
)

const createTimesheetMutation = createResolver(
  TimesheetCreationInput,
  t.string,
  (_parent, args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createTimesheet(args, user))
    )
)

const SessionQueryInput = t.type({ id: PositiveInteger }, 'SessionQueryInput')
const sessionQuery = createResolver(
  SessionQueryInput,
  Session,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getSession(id, user))
    )
)

const SessionsQueryInput = t.intersection(
  [
    ConnectionQueryArgs,
    t.type({
      task: optionFromNullable(PositiveInteger)
    })
  ],
  'SessionsQueryInput'
)
const sessionsQuery = createResolver(
  SessionsQueryInput,
  Connection(Session),
  (_parent, args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listSessions(args, user))
    )
)

export default {
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
  }
}
