import { Session } from './Session'
import { User } from '../user/User'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server'
import { insert, toSQLDate, update, remove } from '../misc/dbUtils'
import { queryToConnection } from '../misc/queryToConnection'

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
      throw new ApolloError('You cannot have more than one open session', 'COOLER_409')
    }
  }

  const { lastID } = await insert('session', {
    ...session,
    start_time: toSQLDate(new Date(session.start_time!))
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

export async function listSessions(args: ConnectionQueryArgs & { task?: number }, user: User) {
  const db = await getDatabase()

  const openSession = await db.get<Session>(SQL`
    SELECT *
    FROM session
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND session.end_time IS NULL
  `)

  const sql = SQL`
    JOIN task ON task.id = session.task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id}
  `

  args.task && sql.append(SQL` AND session.task = ${args.task}`)

  return {
    open: openSession || null,
    all: await queryToConnection(args, ['session.*'], 'session', sql)
  }
}

export async function updateSession(id: number, session: Partial<Session>, user: User) {
  const db = await getDatabase()
  const currentSession = await db.get<{ end_time: string | null, user: number }>(SQL`
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
        throw new ApolloError('You cannot assign this task to a session', 'COOLER_403')
      }
    }

    const args = Object.entries(
      { start_time, end_time, task }
    ).filter(
      ([, value]) => value !== undefined
    ).reduce(
      (res, [key, value]) => ({ ...res, [key]: value }), {}
    )

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
