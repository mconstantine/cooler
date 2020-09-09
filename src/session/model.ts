import { Session } from './interface'
import { User } from '../user/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server-express'
import { insert, toSQLDate, update, remove } from '../misc/dbUtils'
import { queryToConnection } from '../misc/queryToConnection'
import { Task } from '../task/interface'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { Client, ClientType } from '../client/interface'

const TIMESHEETS_PATH = '/public/timesheets'

export async function createSession(session: Partial<Session>, user: User) {
  const db = await getDatabase()

  const task = await db.get<{ user: number }>(SQL`
    SELECT client.user
    FROM task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE task.id = ${session.task}
  `)

  if (!task) {
    return null
  }

  if (task.user !== user.id) {
    throw new ApolloError('Unauthorized', 'COOLER_403')
  }

  if (!session.end_time) {
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
  }

  const { lastID } = await insert('session', {
    ...session,
    start_time: toSQLDate(new Date(session.start_time || Date.now()))
  })

  return db.get<Session>(SQL`SELECT * FROM session WHERE id = ${lastID}`)
}

export async function getSession(id: number, user: User) {
  const db = await getDatabase()

  const session = await db.get<Session & { user: number }>(SQL`
    SELECT session.*, client.user
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE session.id = ${id}
  `)

  if (session && session.user !== user.id) {
    throw new ApolloError('You cannot see this session', 'COOLER_403')
  }

  return session
}

export async function listSessions(
  args: ConnectionQueryArgs & { task?: number },
  user: User
) {
  const sql = SQL`
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id}
  `

  args.task && sql.append(SQL` AND session.task = ${args.task}`)

  return await queryToConnection(args, ['session.*'], 'session', sql)
}

export async function updateSession(
  id: number,
  session: Partial<Session>,
  user: User
) {
  const db = await getDatabase()
  const currentSession = await db.get<{
    end_time: string | null
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

    const args = Object.entries({ start_time, end_time, task })
      .filter(([, value]) => value !== undefined)
      .reduce((res, [key, value]) => ({ ...res, [key]: value }), {})

    await update('session', { ...args, id })
  }

  return await db.get<Session>(SQL`SELECT * FROM session WHERE id = ${id}`)
}

export async function deleteSession(id: number, user: User) {
  const db = await getDatabase()

  const session = await db.get<Session & { user: number }>(SQL`
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
  return session
}

export async function createTimesheet(
  since: string,
  to: string,
  project: number,
  user: User
) {
  const db = await getDatabase()

  const p = (await db.get<{ user: number }>(SQL`
    SELECT client.user
    FROM project
    JOIN client ON client.id = project.client
    WHERE project.id = ${project}
  `))!

  if (!p) {
    return null
  }

  if (p.user !== user.id) {
    throw new ApolloError('You cannot create this timesheet', 'COOLER_403')
  }

  const sessions = await db.all<
    Array<
      Pick<Session, 'start_time'> &
        Pick<Task, 'hourlyCost'> & {
          project: string
          task: string
          duration: number
        } & Pick<Client, 'business_name' | 'first_name' | 'last_name' | 'type'>
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
      session.start_time >= ${toSQLDate(new Date(since))} AND
      session.end_time <= ${toSQLDate(new Date(to))}
    ORDER BY session.start_time
  `)

  const [clientName, projectName, taskName] = (() => {
    if (!sessions.length) {
      return ['', '', '']
    }

    const firstSession = sessions[0]

    return [
      firstSession.type === ClientType.BUSINESS
        ? firstSession.business_name!
        : `${firstSession.first_name} ${firstSession.last_name}`,
      firstSession.project,
      firstSession.task
    ]
  })()

  const rows = sessions.reduce((res, { start_time, duration, hourlyCost }) => {
    const day = start_time.substring(0, 10)

    res[day] = res[day] || { duration: 0, balance: 0 }
    res[day].duration += Math.ceil(duration)
    res[day].balance += Math.ceil(duration) * hourlyCost

    return res
  }, {} as { [date: string]: { duration: number; balance: number } })

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
    'Client;Project;Task;Date;Duration (hours);Balance (€)',
    ...Object.entries(rows).map(([date, { duration, balance }]) => {
      return `"${clientName.replace(/"/g, '\\"')}";"${projectName.replace(
        /"/g,
        '\\"'
      )}";"${taskName.replace(/"/g, '\\"')}";${new Date(
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
