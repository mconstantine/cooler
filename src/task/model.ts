import { Task } from './Task'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { User } from '../user/User'
import { ApolloError } from 'apollo-server'

export async function createTask(task: Partial<Task>, user: User) {
  const db = await getDatabase()

  const project = await db.get<{ user: number }>(SQL`
    SELECT client.user
    FROM project
    JOIN client on project.client = client.id
    WHERE project.id = ${task.project}
  `)

  if (!project) {
    return null
  }

  if (project.user !== user.id) {
    throw new ApolloError('Unauthorized', 'COOLER_403')
  }

  const { lastID } = await insert('task', task)

  return await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${lastID}`)
}

export async function getTask(id: number, user: User) {
  const db = await getDatabase()

  const task = await db.get<Task & { user: number }>(SQL`
    SELECT task.*, client.user
    FROM task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE task.id = ${id}
  `)

  if (task && task.user !== user.id) {
    throw new ApolloError('You cannot see this task', 'COOLER_403')
  }

  return task
}

export async function listTasks(args: ConnectionQueryArgs & { name?: string }, user: User) {
  const sql = SQL`
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE user = ${user.id}
  `

  args.name && sql.append(SQL` AND project.name LIKE ${`%${args.name}%`}`)
  return await queryToConnection(args, ['task.*, client.user'], 'task', sql)
}

export async function updateTask(id: number, task: Partial<Task>, user: User) {
  const db = await getDatabase()
  const currentTask = await db.get<{ user: number }>(SQL`
    SELECT client.user
    FROM task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE task.id = ${id}
  `)

  if (!currentTask) {
    return null
  }

  if (currentTask.user !== user.id) {
    throw new ApolloError('You cannot update this task', 'COOLER_403')
  }

  const { name, description, expectedWorkingHours, project } = task

  if (name || description || expectedWorkingHours || project) {
    if (project) {
      const newProject = await db.get<{ user: number }>(SQL`
        SELECT client.user
        FROM project
        JOIN client ON client.id = project.client
        WHERE project.id = ${project}
      `)

      if (!newProject) {
        return null
      }

      if (newProject.user !== user.id) {
        throw new ApolloError('You cannot assign this project to a task', 'COOLER_403')
      }
    }

    const args = Object.entries(
      { name, description, expectedWorkingHours, project }
    ).filter(
      ([, value]) => value !== undefined
    ).reduce(
      (res, [key, value]) => ({ ...res, [key]: value }), {}
    )

    await update('task', { ...args, id })
  }

  return await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${id}`)
}

export async function deleteTask(id: number, user: User) {
  const db = await getDatabase()

  const task = await db.get<Task & { user: number }>(SQL`
    SELECT task.*, client.user
    FROM task
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE task.id = ${id}
  `)

  if (!task) {
    return null
  }

  if (task.user !== user.id) {
    throw new ApolloError('You cannot delete this task', 'COOLER_403')
  }

  await remove('task', { id })
  return task
}
