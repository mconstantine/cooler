import {
  DatabaseSession,
  Session,
  SessionUpdateInput,
  TimesheetCreationInput
} from './interface'
import { DatabaseUser, User } from '../user/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import SQL from 'sql-template-strings'
import { dbGetAll, dbGet } from '../misc/dbUtils'
import { queryToConnection } from '../misc/queryToConnection'
import { DatabaseTask, Task } from '../task/interface'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { Connection } from '../misc/Connection'
import { getClientName } from '../client/model'
import {
  insertSession,
  getSessionById,
  updateSession as updateDatabaseSession,
  deleteSession as deleteDatabaseSession
} from './database'
import {
  CoolerError,
  coolerError,
  DateFromSQLDate,
  NonNegativeInteger,
  NonNegativeNumber,
  PositiveInteger
} from '../misc/Types'
import { TaskEither } from 'fp-ts/TaskEither'
import { constUndefined, constVoid, pipe } from 'fp-ts/function'
import { getTaskById } from '../task/database'
import { boolean, either, nonEmptyArray, option, taskEither } from 'fp-ts'
import * as t from 'io-ts'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import { getProjectById } from '../project/database'
import { sequenceS } from 'fp-ts/Apply'
import { getClientById } from '../client/database'
import { DatabaseProject } from '../project/interface'
import { TimesheetCreationOutput, UserStatsQueryInput } from './resolvers'
import { a18n } from '../misc/a18n'

const TIMESHEETS_PATH = '/public/timesheets'

export function startSession(
  taskId: PositiveInteger,
  user: User
): TaskEither<CoolerError, Session> {
  return pipe(
    getTaskById(taskId),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The task of this session was not found`)
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        task => task.user === user.id,
        () =>
          coolerError(
            'COOLER_403',
            a18n`You cannot start a session for this task`
          )
      )
    ),
    taskEither.chain(task =>
      dbGet(
        SQL`
          SELECT COUNT(*) as count
          FROM session
          WHERE task = ${task.id} AND end_time IS NULL
        `,
        t.type({
          count: NonNegativeInteger
        })
      )
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_500', a18n`Unable to count existing sessions`)
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        ({ count }) => count === 0,
        () =>
          coolerError(
            'COOLER_409',
            a18n`There is already an open session for this task`
          )
      )
    ),
    taskEither.chain(() =>
      insertSession({
        task: taskId,
        start_time: new Date(),
        end_time: option.none
      })
    ),
    taskEither.chain(getSessionById),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          a18n`Unable to retrieve session after creation`
        )
      )
    )
  )
}

export function getSession(
  id: PositiveInteger,
  user: User
): TaskEither<CoolerError, Session> {
  return pipe(
    getSessionById(id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The session you are looking for was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        session => session.user === user.id,
        () => coolerError('COOLER_403', a18n`You cannot see this session`)
      )
    )
  )
}

const SessionsConnectionQueryArgs = t.intersection(
  [
    ConnectionQueryArgs,
    t.type({
      task: optionFromNullable(PositiveInteger)
    })
  ],
  'SessionsConnectionQueryArgs'
)
type SessionsConnectionQueryArgs = t.TypeOf<typeof SessionsConnectionQueryArgs>

export function listSessions(
  args: SessionsConnectionQueryArgs,
  user: User
): TaskEither<CoolerError, Connection<Session>> {
  const sql = SQL`
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id}
  `

  pipe(
    args.task,
    option.fold(constVoid, task => sql.append(SQL` AND session.task = ${task}`))
  )

  return queryToConnection(
    args,
    ['session.*', 'client.user'],
    'session',
    DatabaseSession,
    sql
  )
}

export function updateSession(
  id: PositiveInteger,
  input: SessionUpdateInput,
  user: User
): TaskEither<CoolerError, Session> {
  return pipe(
    getSessionById(id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The session you want to update was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        session => session.user === user.id,
        () => coolerError('COOLER_403', a18n`You cannot update this session`)
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        session =>
          option.isNone(session.end_time) ||
          (!!input.end_time && option.isSome(input.end_time)),
        () =>
          coolerError('COOLER_409', a18n`You cannot reopen a closed session`)
      )
    ),
    taskEither.chain(session =>
      pipe(
        input.task,
        option.fromNullable,
        option.fold(
          () => taskEither.right(session),
          task =>
            pipe(
              getTaskById(task),
              taskEither.chain(
                taskEither.fromOption(() =>
                  coolerError('COOLER_404', a18n`The new task was not found`)
                )
              ),
              taskEither.chain(
                taskEither.fromPredicate(
                  task => task.user === user.id,
                  () =>
                    coolerError(
                      'COOLER_403',
                      a18n`You cannot assign this task to a session`
                    )
                )
              ),
              taskEither.map(() => session)
            )
        )
      )
    ),
    taskEither.chain(session => updateDatabaseSession(session.id, input)),
    taskEither.chain(() => getSessionById(id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_500', a18n`Unable to find the session after update`)
      )
    )
  )
}

export function stopSession(
  id: PositiveInteger,
  user: User
): TaskEither<CoolerError, Session> {
  return updateSession(id, { end_time: option.some(new Date()) }, user)
}

export function deleteSession(
  id: PositiveInteger,
  user: User
): TaskEither<CoolerError, Session> {
  return pipe(
    getSessionById(id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The session you are trying to delete was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        session => session.user === user.id,
        () => coolerError('COOLER_403', a18n`You cannot delete this session`)
      )
    ),
    taskEither.chain(session =>
      pipe(
        deleteDatabaseSession(session.id),
        taskEither.map(() => session)
      )
    )
  )
}

export function createTimesheet(
  input: TimesheetCreationInput,
  user: User
): TaskEither<CoolerError, TimesheetCreationOutput> {
  const timesheetsDirectoryPath = path.join(process.cwd(), TIMESHEETS_PATH)
  const filename = `${crypto.randomBytes(12).toString('hex')}.csv`

  return pipe(
    getProjectById(input.project),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The project was not found`)
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        project => project.user === user.id,
        () =>
          coolerError(
            'COOLER_403',
            a18n`You cannot create a timesheet for this project`
          )
      )
    ),
    taskEither.chain(project =>
      sequenceS(taskEither.taskEither)({
        client: pipe(
          getClientById(project.client),
          taskEither.chain(
            taskEither.fromOption(() =>
              coolerError(
                'COOLER_404',
                a18n`The client of the project was not found`
              )
            )
          )
        ),
        sessions: dbGetAll(
          SQL`
            SELECT
              project.name AS project_name,
              task.name AS task_name,
              task.start_time AS task_start_time,
              MAX(session.end_time) AS task_end_time,
              ROUND(SUM((
                strftime('%s', session.end_time) - strftime('%s', session.start_time)
              ) / 3600.0)) AS duration,
              ROUND(task.hourlyCost * SUM((
                strftime('%s', session.end_time) - strftime('%s', session.start_time)
              ) / 3600.0), 2) AS balance
            FROM session
            JOIN task ON task.id = session.task
            JOIN project ON project.id = task.project
            JOIN client ON client.id = project.client
            WHERE
              task.project = ${project.id} AND
              session.start_time >= ${DateFromSQLDate.encode(input.since)} AND
              session.end_time IS NOT NULL AND
              session.end_time <= ${DateFromSQLDate.encode(input.to)}
            GROUP BY task.id
            ORDER BY task.start_time;
          `,
          t.type({
            project_name: NonEmptyString,
            task_name: NonEmptyString,
            task_start_time: DateFromSQLDate,
            task_end_time: DateFromSQLDate,
            duration: NonNegativeNumber,
            balance: NonNegativeNumber
          })
        )
      })
    ),
    taskEither.map(({ client, sessions }) => {
      const client_name = getClientName(client)

      return sessions.map(session => ({
        ...session,
        client_name
      }))
    }),
    taskEither.chain(sessions =>
      pipe(
        either.tryCatch(
          () => fs.existsSync(timesheetsDirectoryPath),
          () =>
            coolerError(
              'COOLER_500',
              a18n`Unable to access the files directory`
            )
        ),
        either.chain(
          boolean.fold(
            () =>
              either.tryCatch(
                () => fs.mkdirSync(timesheetsDirectoryPath),
                () =>
                  coolerError(
                    'COOLER_500',
                    a18n`Unable to create the files directory`
                  )
              ),
            () => either.right(void 0)
          )
        ),
        either.chain(() =>
          either.tryCatch(
            () => fs.readdirSync(timesheetsDirectoryPath),
            () =>
              coolerError(
                'COOLER_500',
                a18n`Unable to read the files directory`
              )
          )
        ),
        either.chain(files =>
          pipe(
            files.filter(s => s.charAt(0) !== '.'),
            nonEmptyArray.fromArray,
            option.fold(
              () => either.right(undefined),
              nonEmptyArray.reduce(either.right(undefined), (res, filename) =>
                pipe(
                  res,
                  either.chain(() =>
                    either.tryCatch(
                      () =>
                        fs.unlinkSync(
                          path.join(timesheetsDirectoryPath, filename)
                        ),
                      () =>
                        coolerError(
                          'COOLER_500',
                          a18n`Unable to delete the old files`
                        )
                    )
                  ),
                  either.map(constUndefined)
                )
              )
            )
          )
        ),
        either.chain(() => {
          const handleString = (s: string) => `"${s.replace(/"/g, '\\"')}"`

          const headers = [
            'Client',
            'Project',
            'Task',
            'Start time',
            'End time',
            'Duration (hours)',
            'Balance (€)'
          ].join(';')

          const rows = sessions.map(session =>
            [
              handleString(session.client_name),
              handleString(session.project_name),
              handleString(session.task_name),
              session.task_start_time,
              session.task_end_time,
              session.duration,
              session.balance
            ].join(';')
          )

          const content = [headers, ...rows].join('\n')

          return either.tryCatch(
            () =>
              fs.writeFileSync(
                path.join(timesheetsDirectoryPath, filename),
                content,
                'utf8'
              ),
            () => coolerError('COOLER_500', a18n`Unable to write the file`)
          )
        }),
        taskEither.fromEither
      )
    ),
    taskEither.map(() => ({
      fileLocation: path.join(TIMESHEETS_PATH, filename)
    }))
  )
}

export function getSessionTask(
  session: DatabaseSession
): TaskEither<CoolerError, Task> {
  return pipe(
    getTaskById(session.task),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The task of this session was not found`)
      )
    )
  )
}

export function getTaskSessions(
  task: DatabaseTask,
  args: ConnectionQueryArgs,
  user: User
): TaskEither<CoolerError, Connection<Session>> {
  return listSessions({ ...args, task: option.some(task.id) }, user)
}

export function getTaskActualWorkingHours(
  task: DatabaseTask
): TaskEither<CoolerError, number> {
  return pipe(
    dbGet(
      SQL`
        SELECT IFNULL(SUM((
          strftime('%s', session.end_time) - strftime('%s', session.start_time)
        ) / 3600.0), 0) AS actualWorkingHours
        FROM session
        WHERE task = ${task.id} AND end_time IS NOT NULL
      `,
      t.type({
        actualWorkingHours: t.number
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The task was not found`)
      )
    ),
    taskEither.map(({ actualWorkingHours }) => actualWorkingHours)
  )
}

export function getTaskBudget(
  task: DatabaseTask
): TaskEither<CoolerError, number> {
  return pipe(
    dbGet(
      SQL`
        SELECT IFNULL(expectedWorkingHours * hourlyCost, 0) AS budget
        FROM task
        WHERE id = ${task.id}
      `,
      t.type({
        budget: t.number
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The task was not found`)
      )
    ),
    taskEither.map(({ budget }) => budget)
  )
}

export function getTaskBalance(
  task: DatabaseTask
): TaskEither<CoolerError, number> {
  return pipe(
    dbGet(
      SQL`
        SELECT IFNULL(SUM((
          strftime('%s', session.end_time) - strftime('%s', session.start_time)
        ) / 3600.0 * task.hourlyCost), 0) AS balance
        FROM session
        JOIN task ON task.id = session.task
        WHERE task.id = ${task.id}
      `,
      t.type({
        balance: t.number
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The task was not found`)
      )
    ),
    taskEither.map(({ balance }) => balance)
  )
}

export function getProjectExpectedWorkingHours(
  project: DatabaseProject
): TaskEither<CoolerError, NonNegativeNumber> {
  return pipe(
    dbGet(
      SQL`
        SELECT IFNULL(SUM(expectedWorkingHours), 0) AS expectedWorkingHours
        FROM task
        WHERE project = ${project.id}
      `,
      t.type({
        expectedWorkingHours: NonNegativeNumber
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The project was not found`)
      )
    ),
    taskEither.map(({ expectedWorkingHours }) => expectedWorkingHours)
  )
}

export function getProjectActualWorkingHours(
  project: DatabaseProject
): TaskEither<CoolerError, NonNegativeNumber> {
  return pipe(
    dbGet(
      SQL`
        SELECT IFNULL(SUM((
          strftime('%s', session.end_time) - strftime('%s', session.start_time)
        ) / 3600.0), 0) AS actualWorkingHours
        FROM session
        JOIN task ON task.id = session.task
        WHERE task.project = ${project.id} AND session.end_time IS NOT NULL
      `,
      t.type({
        actualWorkingHours: NonNegativeNumber
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The project was not found`)
      )
    ),
    taskEither.map(({ actualWorkingHours }) => actualWorkingHours)
  )
}

export function getProjectBudget(
  project: DatabaseProject
): TaskEither<CoolerError, NonNegativeNumber> {
  return pipe(
    dbGet(
      SQL`
        SELECT IFNULL(SUM(hourlyCost * expectedWorkingHours), 0) AS budget
        FROM task
        WHERE project = ${project.id}
      `,
      t.type({
        budget: NonNegativeNumber
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The project was not found`)
      )
    ),
    taskEither.map(({ budget }) => budget)
  )
}

export function getProjectBalance(
  project: DatabaseProject
): TaskEither<CoolerError, NonNegativeNumber> {
  return pipe(
    dbGet(
      SQL`
        SELECT IFNULL(SUM((
          strftime('%s', session.end_time) - strftime('%s', session.start_time)
        ) / 3600.0 * task.hourlyCost), 0) AS balance
        FROM session
        JOIN task ON task.id = session.task
        WHERE task.project = ${project.id}
      `,
      t.type({
        balance: NonNegativeNumber
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The project was not found`)
      )
    ),
    taskEither.map(({ balance }) => balance)
  )
}

export function getUserOpenSessions(
  user: DatabaseUser,
  args: ConnectionQueryArgs
): TaskEither<CoolerError, Connection<Session>> {
  return queryToConnection(
    args,
    ['session.*'],
    'session',
    DatabaseSession,
    SQL`
      JOIN task ON task.id = session.task
      JOIN project ON project.id = task.project
      JOIN client ON client.id = project.client
      WHERE client.user = ${user.id} AND session.end_time IS NULL
    `
  )
}

export function getUserExpectedWorkingHours(
  user: DatabaseUser,
  input: UserStatsQueryInput
): TaskEither<CoolerError, NonNegativeNumber> {
  const sql = SQL`
    SELECT IFNULL(SUM(task.expectedWorkingHours), 0) AS expectedWorkingHours
    FROM task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND project.cashed_at IS NULL
  `

  pipe(
    input.since,
    option.fold(constVoid, since =>
      sql.append(SQL` AND task.start_time >= ${DateFromSQLDate.encode(since)}`)
    )
  )

  return pipe(
    dbGet(
      sql,
      t.type({
        expectedWorkingHours: NonNegativeNumber
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The user was not found`)
      )
    ),
    taskEither.map(({ expectedWorkingHours }) => expectedWorkingHours)
  )
}

export function getUserActualWorkingHours(
  user: DatabaseUser,
  input: UserStatsQueryInput
): TaskEither<CoolerError, NonNegativeNumber> {
  const sql = SQL`
    SELECT IFNULL(SUM((
      strftime('%s', session.end_time) - strftime('%s', session.start_time)
    ) / 3600.0), 0) AS actualWorkingHours
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND project.cashed_at IS NULL
  `

  pipe(
    input.since,
    option.fold(constVoid, since =>
      sql.append(
        SQL` AND session.start_time >= ${DateFromSQLDate.encode(since)}`
      )
    )
  )

  return pipe(
    dbGet(
      sql,
      t.type({
        actualWorkingHours: NonNegativeNumber
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The user was not found`)
      )
    ),
    taskEither.map(({ actualWorkingHours }) => actualWorkingHours)
  )
}

export function getUserBudget(
  user: DatabaseUser,
  input: UserStatsQueryInput
): TaskEither<CoolerError, NonNegativeNumber> {
  const sql = SQL`
    SELECT IFNULL(SUM(expectedWorkingHours * hourlyCost), 0) AS budget
    FROM task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND project.cashed_at IS NULL
  `

  pipe(
    input.since,
    option.fold(constVoid, since =>
      sql.append(SQL` AND task.start_time >= ${DateFromSQLDate.encode(since)}`)
    )
  )

  return pipe(
    dbGet(
      sql,
      t.type({
        budget: NonNegativeNumber
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The user was not found`)
      )
    ),
    taskEither.map(({ budget }) => budget)
  )
}

export function getUserBalance(
  user: DatabaseUser,
  input: UserStatsQueryInput
): TaskEither<CoolerError, NonNegativeNumber> {
  const sql = SQL`
    SELECT IFNULL(SUM((
      strftime('%s', session.end_time) - strftime('%s', session.start_time)
    ) / 3600.0 * task.hourlyCost), 0) AS balance
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE project.cashed_at IS NULL AND client.user = ${user.id}
  `

  pipe(
    input.since,
    option.fold(constVoid, since =>
      sql.append(
        SQL` AND session.start_time >= ${DateFromSQLDate.encode(since)}`
      )
    )
  )

  return pipe(
    dbGet(
      sql,
      t.type({
        balance: NonNegativeNumber
      })
    ),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The user was not found`)
      )
    ),
    taskEither.map(({ balance }) => balance)
  )
}
