import {
  Session,
  SessionUpdateInput,
  TimesheetCreationInput
} from './interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { ensureUser } from '../misc/ensureUser'
import {
  startSession,
  updateSession,
  deleteSession,
  getSession,
  listSessions,
  createTimesheet,
  stopSession
} from './model'
import { Connection } from '../misc/Connection'
import * as t from 'io-ts'
import { DateFromISOString, optionFromNullable } from 'io-ts-types'
import { createResolver } from '../misc/createResolver'
import { IdInput, PositiveInteger } from '../misc/Types'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { Resolvers } from '../assignResolvers'

export const UserDataFromSessionResolverInput = t.type(
  {
    since: optionFromNullable(DateFromISOString)
  },
  'UserDataFromSessionResolverInput'
)
export type UserDataFromSessionResolverInput = t.TypeOf<
  typeof UserDataFromSessionResolverInput
>

export const TimesheetCreationOutput = t.type(
  { fileLocation: t.string },
  'TimesheetCreationOutput'
)
export type TimesheetCreationOutput = t.TypeOf<typeof TimesheetCreationOutput>

// const sessionTaskResolver = createResolver<DatabaseSession>(
//   EmptyObject,
//   Task,
//   getSessionTask
// )

// const taskSessionsResolver = createResolver<DatabaseTask>(
//   ConnectionQueryArgs,
//   Connection(Session),
//   (task, args, context) =>
//     pipe(
//       ensureUser(context),
//       taskEither.chain(user => getTaskSessions(task, args, user))
//     )
// )

// const taskActualWorkingHoursResolver = createResolver<DatabaseTask>(
//   EmptyObject,
//   t.number,
//   getTaskActualWorkingHours
// )

// const taskBudgetResolver = createResolver<DatabaseTask>(
//   EmptyObject,
//   t.number,
//   getTaskBudget
// )

// const taskBalanceResolver = createResolver<DatabaseTask>(
//   EmptyObject,
//   t.number,
//   getTaskBalance
// )

// const projectExpectedWorkingHoursResolver = createResolver(
//   EmptyObject,
//   t.number,
//   getProjectExpectedWorkingHours
// )

// const projectActualWorkingHoursResolver = createResolver(
//   EmptyObject,
//   t.number,
//   getProjectActualWorkingHours
// )

// const projectBudgetResolver = createResolver<DatabaseProject>(
//   EmptyObject,
//   t.number,
//   getProjectBudget
// )

// const projectBalanceResolver = createResolver<DatabaseProject>(
//   EmptyObject,
//   t.number,
//   getProjectBalance
// )

// const userOpenSessionsResolver = createResolver<DatabaseUser>(
//   ConnectionQueryArgs,
//   Connection(Session),
//   getUserOpenSessions
// )

// const userExpectedWorkingHoursResolver = createResolver<DatabaseUser>(
//   UserDataFromSessionResolverInput,
//   t.number,
//   getUserExpectedWorkingHours
// )

// const userActualWorkingHoursResolver = createResolver<DatabaseUser>(
//   UserDataFromSessionResolverInput,
//   t.number,
//   getUserActualWorkingHours
// )

// const userBudgetResolver = createResolver<DatabaseUser>(
//   UserDataFromSessionResolverInput,
//   t.number,
//   getUserBudget
// )

// const userBalanceResolver = createResolver<DatabaseUser>(
//   UserDataFromSessionResolverInput,
//   t.number,
//   getUserBalance
// )

const startSessionResolver = createResolver(
  {
    // This is the of a task, not of a session
    params: IdInput,
    output: Session
  },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => startSession(id, user))
    )
)

const stopSessionResolver = createResolver(
  {
    params: IdInput,
    output: Session
  },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => stopSession(id, user))
    )
)

const updateSessionResolver = createResolver(
  {
    params: IdInput,
    body: SessionUpdateInput,
    output: Session
  },
  ({ params: { id }, body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateSession(id, body, user))
    )
)

const deleteSessionResolver = createResolver(
  {
    params: IdInput,
    output: Session
  },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteSession(id, user))
    )
)

const createTimesheetResolver = createResolver(
  {
    body: TimesheetCreationInput,
    output: TimesheetCreationOutput
  },
  ({ body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createTimesheet(body, user))
    )
)

const getSessionResolver = createResolver(
  {
    params: IdInput,
    output: Session
  },
  ({ params: { id } }, context) =>
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

const getSessionsResolver = createResolver(
  {
    query: SessionsQueryInput,
    output: Connection(Session)
  },
  ({ query }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listSessions(query, user))
    )
)

const resolvers: Resolvers = {
  path: '/sessions',
  POST: {
    '/:id/start': startSessionResolver,
    '/:id/stop': stopSessionResolver,
    '/timesheet': createTimesheetResolver
  },
  PUT: {
    '/:id': updateSessionResolver
  },
  DELETE: {
    '/:id': deleteSessionResolver
  },
  GET: {
    '/:id': getSessionResolver,
    '/': getSessionsResolver
  }
}

export default resolvers
