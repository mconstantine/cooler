import {
  Task,
  TasksBatchCreationInput,
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
import { definitely } from '../misc/definitely'
import { removeUndefined } from '../misc/removeUndefined'

async function validateTaskCreation(
  project: number,
  user: User
): Promise<boolean> {
  const db = await getDatabase()

  const projectUser = await db.get<{ user: number }>(SQL`
    SELECT client.user
    FROM project
    JOIN client on project.client = client.id
    WHERE project.id = ${project}
  `)

  if (!projectUser) {
    return false
  }

  if (projectUser.user !== user.id) {
    throw new ApolloError('Unauthorized', 'COOLER_403')
  }

  return true
}

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
  if (!(await validateTaskCreation(project, user))) {
    return null
  }

  const db = await getDatabase()

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

export async function createTasksBatch(
  input: TasksBatchCreationInput,
  user: User
): Promise<Project | null> {
  if (!(await validateTaskCreation(input.project, user))) {
    return null
  }

  const db = await getDatabase()

  const existingTasks = await db.all<TaskFromDatabase[]>(SQL`
    SELECT start_time
    FROM task
    WHERE project = ${input.project}
  `)

  const inputFrom = fromSQLDate(input.from)
  const inputTo = fromSQLDate(input.to)

  const inputStartTime = fromSQLDate(input.start_time)
  const days = Math.ceil((inputTo.getTime() - inputFrom.getTime()) / 86400000)

  for (let i = 0; i <= days; i++) {
    const start_time = new Date(inputFrom.getTime() + i * 86400000)
    const sqlDateStartTime = toSQLDate(start_time)

    if (
      existingTasks.find(
        ({ start_time }) =>
          start_time.substring(0, 10) === sqlDateStartTime.substring(0, 10)
      )
    ) {
      continue
    }

    start_time.setHours(inputStartTime.getHours())
    start_time.setMinutes(inputStartTime.getMinutes())
    start_time.setSeconds(inputStartTime.getSeconds())

    const weekday = start_time.getDay()
    let bitMask: number

    switch (weekday) {
      case 0:
        bitMask = 0x0000001
        break
      case 1:
        bitMask = 0x0000010
        break
      case 2:
        bitMask = 0x0000100
        break
      case 3:
        bitMask = 0x0001000
        break
      case 4:
        bitMask = 0x0010000
        break
      case 5:
        bitMask = 0x0100000
        break
      case 6:
        bitMask = 0x1000000
        break
      default:
        bitMask = 0x0000000
        break
    }

    if ((bitMask & input.repeat) === 0) {
      continue
    }

    await insert('task', {
      name: formatTaskName(input.name, start_time, i),
      project: input.project,
      expectedWorkingHours: input.expectedWorkingHours,
      hourlyCost: input.hourlyCost,
      start_time: toSQLDate(start_time)
    })
  }

  const res = await db.get<ProjectFromDatabase>(SQL`
    SELECT * FROM project WHERE id = ${input.project}
  `)

  return res ? projectFromDatabase(res) : null
}

const taskNamePattern = /^\s*#\s*$|^D{1,4}$|^M{1,4}$|^Y{1,4}$/

function formatTaskName(name: string, date: Date, index: number): string {
  let didMatch = false

  function match(matchFunction: (s: string) => string): (s: string) => string {
    return s => {
      didMatch = true
      return matchFunction(s)
    }
  }

  const matches = {
    '#': () => (index + 1).toString(10),
    DDDD: () => date.toLocaleDateString(undefined, { weekday: 'long' }),
    DDD: () => date.toLocaleDateString(undefined, { weekday: 'short' }),
    DD: () => {
      const n = date.getDate()
      return (n < 10 ? '0' : '') + n
    },
    D: () => date.getDate().toString(10),
    MMMM: () => date.toLocaleString(undefined, { month: 'long' }),
    MMM: () => date.toLocaleString(undefined, { month: 'short' }),
    MM: () => {
      const n = date.getMonth() + 1
      return (n < 10 ? '0' : '') + n
    },
    M: () => (date.getMonth() + 1).toString(10),
    YYYY: () => date.getFullYear().toString(10),
    YY: () => date.getFullYear().toString(10).substring(2)
  }

  return name
    .split(/\b/)
    .map(s => {
      if (!taskNamePattern.test(s)) {
        return s
      }

      didMatch = false
      const entries = Object.entries(matches)

      for (let [target, replacement] of entries) {
        s = s.replace(target, match(replacement))

        if (didMatch) {
          return s
        }
      }

      return s
    })
    .join('')
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

    const args = removeUndefined({
      name,
      description,
      expectedWorkingHours,
      hourlyCost,
      project,
      start_time
    })

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

export async function getTaskProject(task: TaskFromDatabase): Promise<Project> {
  const db = await getDatabase()

  const project = definitely(
    await db.get<ProjectFromDatabase>(
      SQL`SELECT * FROM project WHERE id = ${task.project}`
    )
  )

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
