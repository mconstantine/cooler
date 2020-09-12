import {
  Task,
  TaskCreationInput,
  TaskFromDatabase,
  TaskUpdateInput
} from './interface'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove, fromSQLDate, toSQLDate } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { mapConnection, queryToConnection } from '../misc/queryToConnection'
import { User, UserFromDatabase } from '../user/interface'
import { ApolloError } from 'apollo-server-express'
import { Connection } from '../misc/Connection'
import { Project, ProjectFromDatabase } from '../project/interface'
import { fromDatabase as projectFromDatabase } from '../project/model'
import { SQLDate } from '../misc/Types'

export async function createTask(
  {
    name,
    description,
    project,
    expectedWorkingHours,
    hourlyCost,
    start_time
  }: TaskCreationInput,
  user: User
): Promise<Task | null> {
  const db = await getDatabase()
  const projectUser = await db.get<{ user: number }>(SQL`
    SELECT client.user
    FROM project
    JOIN client on project.client = client.id
    WHERE project.id = ${project}
  `)

  if (!projectUser) {
    return null
  }

  if (projectUser.user !== user.id) {
    throw new ApolloError('Unauthorized', 'COOLER_403')
  }

  const { lastID } = await insert('task', {
    name,
    description,
    project,
    expectedWorkingHours,
    hourlyCost,
    start_time
  })

  const newTask = await db.get<TaskFromDatabase>(
    SQL`SELECT * FROM task WHERE id = ${lastID}`
  )

  if (!newTask) {
    return null
  }

  return fromDatabase(newTask)
}

export async function getTask(id: number, user: User): Promise<Task | null> {
  const db = await getDatabase()

  const task = await db.get<TaskFromDatabase & { user: number }>(SQL`
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
    throw new ApolloError('You cannot see this task', 'COOLER_403')
  }

  return fromDatabase(task)
}

export async function listTasks(
  args: ConnectionQueryArgs & { name?: string },
  user: User
): Promise<Connection<Task>> {
  const sql = SQL`
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE user = ${user.id}
  `

  args.name && sql.append(SQL` AND project.name LIKE ${`%${args.name}%`}`)

  const connection = await queryToConnection<TaskFromDatabase>(
    args,
    ['task.*, client.user'],
    'task',
    sql
  )

  return mapConnection(connection, fromDatabase)
}

export async function updateTask(
  id: number,
  task: TaskUpdateInput,
  user: User
): Promise<Task | null> {
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

  const {
    name,
    description,
    expectedWorkingHours,
    hourlyCost,
    project,
    start_time
  } = task

  if (
    name ||
    description ||
    expectedWorkingHours ||
    hourlyCost ||
    project ||
    start_time
  ) {
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
        throw new ApolloError(
          'You cannot assign this project to a task',
          'COOLER_403'
        )
      }
    }

    const args = Object.entries({
      name,
      description,
      expectedWorkingHours,
      hourlyCost,
      project,
      start_time
    })
      .filter(([, value]) => value !== undefined)
      .reduce((res, [key, value]) => ({ ...res, [key]: value }), {})

    await update('task', { ...args, id })
  }

  const updatedTask = await db.get<TaskFromDatabase>(
    SQL`SELECT * FROM task WHERE id = ${id}`
  )

  if (!updatedTask) {
    return null
  }

  return fromDatabase(updatedTask)
}

export async function deleteTask(id: number, user: User): Promise<Task | null> {
  const db = await getDatabase()

  const task = await db.get<TaskFromDatabase & { user: number }>(SQL`
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

  return fromDatabase(task)
}

export async function getTaskProject(
  task: TaskFromDatabase
): Promise<Project | null> {
  const db = await getDatabase()

  const project = await db.get<ProjectFromDatabase>(
    SQL`SELECT * FROM project WHERE id = ${task.project}`
  )

  if (!project) {
    return null
  }

  return projectFromDatabase(project)
}

export async function getUserTasks(
  user: UserFromDatabase,
  args: ConnectionQueryArgs
): Promise<Connection<Task>> {
  const connection = await queryToConnection<TaskFromDatabase>(
    args,
    ['task.*'],
    'task',
    SQL`
      JOIN project ON project.id = task.project
      JOIN client ON project.client = client.id
      WHERE client.user = ${user.id}
    `
  )

  return mapConnection(connection, fromDatabase)
}

export async function getProjectTasks(
  project: ProjectFromDatabase,
  args: ConnectionQueryArgs
): Promise<Connection<Task>> {
  const connection = await queryToConnection<TaskFromDatabase>(
    args,
    ['*'],
    'task',
    SQL`WHERE project = ${project.id}`
  )

  return mapConnection(connection, fromDatabase)
}

export function fromDatabase(task: TaskFromDatabase): Task {
  return {
    ...task,
    created_at: fromSQLDate(task.created_at),
    updated_at: fromSQLDate(task.updated_at),
    start_time: fromSQLDate(task.start_time)
  }
}

export function toDatabase<
  T extends Partial<Omit<Task, 'start_time'>> & { start_time: undefined }
>(task: T): T
export function toDatabase<
  T extends Partial<Omit<Task, 'start_time'>> & { start_time: Date }
>(task: T): Omit<T, 'start_time'> & { start_time: SQLDate }
export function toDatabase<
  T extends Partial<Omit<Task, 'start_time'>> & {
    start_time: Date | undefined
  }
>(task: T): Omit<T, 'start_time'> & { start_time: SQLDate | undefined } {
  return {
    ...task,
    ...(task.start_time
      ? {
          start_time: toSQLDate(task.start_time)
        }
      : {})
  }
}
