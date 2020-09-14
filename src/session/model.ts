import {
  Session,
  SessionFromDatabase,
  SessionUpdateInput,
  TimesheetCreationInput
} from './interface'
import { User, UserFromDatabase } from '../user/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server-express'
import { insert, toSQLDate, update, remove, fromSQLDate } from '../misc/dbUtils'
import { mapConnection, queryToConnection } from '../misc/queryToConnection'
import { Task, TaskFromDatabase } from '../task/interface'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { ClientFromDatabase, ClientType } from '../client/interface'
import { ID, SQLDate } from '../misc/Types'
import { Connection } from '../misc/Connection'
import { fromDatabase as taskFromDatabase } from '../task/model'
import { ProjectFromDatabase } from '../project/interface'
import { SinceArg } from './resolvers'
import { definitely } from '../misc/definitely'
import { removeUndefined } from '../misc/removeUndefined'
import { getClientName } from '../client/model'

const TIMESHEETS_PATH = '/public/timesheets'

export async function startSession(
  taskId: ID,
  user: User
): Promise<Session | null> {
  const db = await getDatabase()

  const task = await db.get<{ user: number }>(SQL`
    SELECT client.user
    FROM task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE task.id = ${taskId}
  `)

  if (!task) {
    return null
  }

  if (task.user !== user.id) {
    throw new ApolloError('Unauthorized', 'COOLER_403')
  }

  const [{ count }] = await db.all<[{ count: number }]>(SQL`
    SELECT COUNT(session.id) AS count
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND session.end_time IS NULL
  `)

  if (count) {
    throw new ApolloError(
      'You cannot have more than one open session',
      'COOLER_409'
    )
  }

  const { lastID } = await insert('session', {
    task: taskId,
    start_time: toSQLDate(new Date())
  })

  const session = await db.get<SessionFromDatabase>(
    SQL`SELECT * FROM session WHERE id = ${lastID}`
  )

  if (!session) {
    return null
  }

  return fromDatabase(session)
}

export async function getSession(
  id: number,
  user: User
): Promise<Session | null> {
  const db = await getDatabase()

  const session = await db.get<SessionFromDatabase & { user: number }>(SQL`
    SELECT session.*, client.user
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE session.id = ${id}
  `)

  if (!session) {
    return null
  }

  if (session.user !== user.id) {
    throw new ApolloError('You cannot see this session', 'COOLER_403')
  }

  return fromDatabase(session)
}

export async function listSessions(
  args: ConnectionQueryArgs & { task?: number },
  user: User
): Promise<Connection<Session>> {
  const sql = SQL`
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id}
  `

  args.task && sql.append(SQL` AND session.task = ${args.task}`)

  const connection = await queryToConnection<SessionFromDatabase>(
    args,
    ['session.*'],
    'session',
    sql
  )

  return mapConnection(connection, fromDatabase)
}

export async function updateSession(
  id: number,
  session: SessionUpdateInput,
  user: User
): Promise<Session | null> {
  const db = await getDatabase()

  const currentSession = await db.get<{
    end_time: SQLDate | null
    user: number
  }>(SQL`
    SELECT client.user, session.end_time
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE session.id = ${id}
  `)

  if (!currentSession) {
    return null
  }

  if (currentSession.user !== user.id) {
    throw new ApolloError('You cannot update this session', 'COOLER_403')
  }

  const { start_time, end_time, task } = session

  if (!end_time && currentSession.end_time) {
    throw new ApolloError('You cannot reopen a closed session', 'COOLER_409')
  }

  if (start_time || end_time || task) {
    if (task) {
      const newTask = await db.get<{ user: number }>(SQL`
        SELECT client.user
        FROM task
        JOIN project ON project.id = task.project
        JOIN client ON client.id = project.client
        WHERE task.id = ${task}
      `)

      if (!newTask) {
        return null
      }

      if (newTask.user !== user.id) {
        throw new ApolloError(
          'You cannot assign this task to a session',
          'COOLER_403'
        )
      }
    }

    const args = removeUndefined({ start_time, end_time, task })

    await update('session', { ...args, id })
  }

  const updatedSession = await db.get<SessionFromDatabase>(
    SQL`SELECT * FROM session WHERE id = ${id}`
  )

  if (!updatedSession) {
    return null
  }

  return fromDatabase(updatedSession)
}

export function stopSession(id: ID, user: User): Promise<Session | null> {
  return updateSession(id, { end_time: toSQLDate(new Date()) }, user)
}

export async function deleteSession(
  id: number,
  user: User
): Promise<Session | null> {
  const db = await getDatabase()

  const session = await db.get<SessionFromDatabase & { user: number }>(SQL`
    SELECT session.*, client.user
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE session.id = ${id}
  `)

  if (!session) {
    return null
  }

  if (session.user !== user.id) {
    throw new ApolloError('You cannot delete this session', 'COOLER_403')
  }

  await remove('session', { id })
  return fromDatabase(session)
}

export async function createTimesheet(
  { since, to, project }: TimesheetCreationInput,
  user: User
): Promise<string | null> {
  const db = await getDatabase()

  const p = await db.get<{ user: number }>(SQL`
    SELECT client.user
    FROM project
    JOIN client ON client.id = project.client
    WHERE project.id = ${project}
  `)

  if (!p) {
    return null
  }

  if (p.user !== user.id) {
    throw new ApolloError('You cannot create this timesheet', 'COOLER_403')
  }

  const sessions = await db.all<
    Array<
      Pick<SessionFromDatabase, 'start_time'> &
        Pick<TaskFromDatabase, 'hourlyCost'> & {
          project: string
          task: string
          duration: number
        } & Pick<
          ClientFromDatabase,
          'business_name' | 'first_name' | 'last_name' | 'type'
        >
    >
  >(SQL`
    SELECT
      session.start_time,
      task.hourlyCost,
      (strftime('%s', session.end_time) - strftime('%s', session.start_time)) / 3600.0 AS duration,
      project.name AS project,
      client.first_name,
      client.last_name,
      client.business_name,
      client.type,
      task.name AS task
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE
      task.project = ${project} AND
      session.start_time >= ${since} AND
      session.end_time <= ${to}
    ORDER BY session.start_time
  `)

  const [clientName, projectName] = (() => {
    if (!sessions.length) {
      return ['', '', '']
    }

    const firstSession = sessions[0]

    return [
      getClientName(firstSession),
      firstSession.project,
      firstSession.task
    ]
  })()

  const rows = sessions.reduce(
    (res, { start_time, duration, task, hourlyCost }) => {
      const day = start_time.substring(0, 10)

      res[day] = res[day] || { duration: 0, balance: 0, tasks: new Set() }
      res[day].duration += Math.ceil(duration)
      res[day].balance += Math.ceil(duration) * hourlyCost
      res[day].tasks.add(task)

      return res
    },
    {} as {
      [date: string]: { duration: number; balance: number; tasks: Set<string> }
    }
  )

  const timesheetsDirectoryPath = path.join(process.cwd(), TIMESHEETS_PATH)

  if (!fs.existsSync(timesheetsDirectoryPath)) {
    fs.mkdirSync(timesheetsDirectoryPath)
  }

  fs.readdirSync(timesheetsDirectoryPath)
    .filter(s => s.charAt(0) !== '.')
    .forEach(filename => {
      fs.unlinkSync(path.join(timesheetsDirectoryPath, filename))
    })

  const filename = `${crypto.randomBytes(12).toString('hex')}.csv`

  const content = [
    'Client;Project;Tasks;Date;Duration (hours);Balance (€)',
    ...Object.entries(rows).map(([date, { duration, balance, tasks }]) => {
      return `"${clientName.replace(/"/g, '\\"')}";"${projectName.replace(
        /"/g,
        '\\"'
      )}";"${[...tasks].join(', ').replace(/"/g, '\\"')}";${new Date(
        date
      ).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })};${duration};${balance}`
    })
  ].join('\n')

  fs.writeFileSync(
    path.join(timesheetsDirectoryPath, filename),
    content,
    'utf8'
  )

  return path.join(TIMESHEETS_PATH, filename)
}

export async function getSessionTask(
  session: SessionFromDatabase
): Promise<Task> {
  const db = await getDatabase()

  const task = definitely(
    await db.get<TaskFromDatabase>(
      SQL`SELECT * FROM task WHERE id = ${session.task}`
    )
  )

  return taskFromDatabase(task)
}

export function getTaskSessions(
  task: TaskFromDatabase,
  args: ConnectionQueryArgs,
  user: User
): Promise<Connection<Session>> {
  return listSessions({ ...args, task: task.id }, user)
}

export async function getTaskActualWorkingHours(
  task: TaskFromDatabase
): Promise<number> {
  const db = await getDatabase()

  const { actualWorkingHours } = definitely(
    await db.get<{
      actualWorkingHours: number
    }>(SQL`
    SELECT IFNULL(SUM(
      (strftime('%s', session.end_time) - strftime('%s', session.start_time)) / 3600.0
    ), 0) AS actualWorkingHours
    FROM session
    WHERE task = ${task.id} AND end_time IS NOT NULL
  `)
  )

  return actualWorkingHours
}

export async function getTaskBudget(task: TaskFromDatabase): Promise<number> {
  const db = await getDatabase()

  const { budget } = definitely(
    await db.get<{ budget: number }>(SQL`
    SELECT IFNULL(expectedWorkingHours * hourlyCost, 0) AS budget
    FROM task
    WHERE id = ${task.id}
  `)
  )

  return budget
}

export async function getTaskBalance(task: TaskFromDatabase): Promise<number> {
  const db = await getDatabase()

  const { balance } = definitely(
    await db.get<{ balance: number }>(SQL`
    SELECT IFNULL(SUM((
      strftime('%s', session.end_time) - strftime('%s', session.start_time)
    ) / 3600.0 * task.hourlyCost), 0) AS balance
    FROM session
    JOIN task ON task.id = session.task
    WHERE task.id = ${task.id}
  `)
  )

  return balance
}

export async function getProjectExpectedWorkingHours(
  project: ProjectFromDatabase
): Promise<number> {
  const db = await getDatabase()

  const { expectedWorkingHours } = definitely(
    await db.get<{
      expectedWorkingHours: number
    }>(SQL`
    SELECT IFNULL(SUM(expectedWorkingHours), 0) AS expectedWorkingHours
    FROM task
    WHERE project = ${project.id}
  `)
  )

  return expectedWorkingHours
}

export async function getProjectActualWorkingHours(
  project: ProjectFromDatabase
): Promise<number> {
  const db = await getDatabase()

  const { actualWorkingHours } = definitely(
    await db.get<{
      actualWorkingHours: number
    }>(SQL`
    SELECT IFNULL(SUM(
      (strftime('%s', session.end_time) - strftime('%s', session.start_time)) / 3600.0
    ), 0) AS actualWorkingHours
    FROM session
    JOIN task ON task.id = session.task
    WHERE task.project = ${project.id} AND session.end_time IS NOT NULL
  `)
  )

  return actualWorkingHours
}

export async function getProjectBudget(
  project: ProjectFromDatabase
): Promise<number> {
  const db = await getDatabase()

  const { budget } = definitely(
    await db.get<{ budget: number }>(SQL`
    SELECT IFNULL(SUM(hourlyCost * expectedWorkingHours), 0) AS budget
    FROM task
    WHERE project = ${project.id}
  `)
  )

  return budget
}

export async function getProjectBalance(
  project: ProjectFromDatabase
): Promise<number> {
  const db = await getDatabase()

  const { balance } = definitely(
    await db.get<{ balance: number }>(SQL`
    SELECT IFNULL(SUM((
      strftime('%s', session.end_time) - strftime('%s', session.start_time)
    ) / 3600.0 * task.hourlyCost), 0) AS balance
    FROM session
    JOIN task ON task.id = session.task
    WHERE task.project = ${project.id}
  `)
  )

  return balance
}

export async function getUserOpenSession(
  user: UserFromDatabase
): Promise<Session | null> {
  const db = await getDatabase()

  const openSession = await db.get<SessionFromDatabase>(SQL`
    SELECT session.*
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND session.end_time IS NULL
  `)

  if (!openSession) {
    return null
  }

  return fromDatabase(openSession)
}

export async function getUserExpectedWorkingHours(
  user: UserFromDatabase,
  { since }: SinceArg
): Promise<number> {
  const db = await getDatabase()

  const sql = SQL`
    SELECT IFNULL(SUM(task.expectedWorkingHours), 0) AS expectedWorkingHours
    FROM task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND project.cashed_at IS NULL
  `

  since && sql.append(SQL` AND task.start_time >= ${since}`)

  const { expectedWorkingHours } = definitely(
    await db.get<{
      expectedWorkingHours: number
    }>(sql)
  )

  return expectedWorkingHours
}

export async function getUserActualWorkingHours(
  user: UserFromDatabase,
  { since }: SinceArg
): Promise<number> {
  const db = await getDatabase()

  const sql = SQL`
    SELECT IFNULL(SUM(
      (strftime('%s', session.end_time) - strftime('%s', session.start_time)) / 3600.0
    ), 0) AS actualWorkingHours
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND project.cashed_at IS NULL
  `

  since && sql.append(SQL` AND session.start_time >= ${since}`)

  const { actualWorkingHours } = definitely(
    await db.get<{
      actualWorkingHours: number
    }>(sql)
  )

  return actualWorkingHours
}

export async function getUserBudget(
  user: UserFromDatabase,
  { since }: SinceArg
): Promise<number> {
  const db = await getDatabase()

  const sql = SQL`
    SELECT IFNULL(SUM(expectedWorkingHours * hourlyCost), 0) AS budget
    FROM task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND project.cashed_at IS NULL
  `

  since && sql.append(SQL` AND task.start_time >= ${since}`)

  const { budget } = definitely(await db.get<{ budget: number }>(sql))

  return budget
}

export async function getUserBalance(
  user: UserFromDatabase,
  { since }: SinceArg
): Promise<number> {
  const db = await getDatabase()

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

  since && sql.append(SQL` AND session.start_time >= ${since}`)

  const { balance } = definitely(await db.get<{ balance: number }>(sql))

  return balance
}

export function fromDatabase(session: SessionFromDatabase): Session {
  return {
    ...session,
    start_time: fromSQLDate(session.start_time),
    end_time: session.end_time ? fromSQLDate(session.end_time) : null
  }
}

export function toDatabase(session: Session): SessionFromDatabase {
  return {
    ...session,
    start_time: toSQLDate(session.start_time),
    end_time: session.end_time ? toSQLDate(session.end_time) : null
  }
}
