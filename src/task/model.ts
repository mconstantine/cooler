import { Task } from './Task'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { User } from '../user/User'
import { Project } from '../project/Project'
import { ApolloError } from 'apollo-server'

export async function createTask(task: Partial<Task>, user: User) {
  const db = await getDatabase()
  const project = await db.get<Project & { user: number }>(SQL`
    SELECT project.*, client.user
    FROM project
    JOIN client on project.client = client.id
    WHERE project.id = ${task.project}
  `)

  if (!project || project.user !== user.id) {
    throw new ApolloError('Unauthorized', 'COOLER_403')
  }

  const { lastID } = await insert('task', {
    ...task,
    actualWorkingHours: task.actualWorkingHours || 0
  })

  return await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${lastID}`)
}

// TODO: list only tasks the user can see
export async function listTasks(args: ConnectionQueryArgs & { name?: string }) {
  return await queryToConnection(
    args,
    ['*'],
    'task',
    args.name ? SQL`WHERE name like ${`%${args.name}%`}` : undefined
  )
}

// TODO: make sure that the user can update the task
export async function updateTask(id: number, task: Partial<Task>) {
  const db = await getDatabase()
  const { name, description, expectedWorkingHours, actualWorkingHours, project } = task

  if (name || description || expectedWorkingHours || actualWorkingHours || project) {
    const args = Object.entries(
      { name, description, expectedWorkingHours, actualWorkingHours, project }
    ).filter(
      ([, value]) => value !== undefined
    ).reduce(
      (res, [key, value]) => ({ ...res, [key]: value }), {}
    )

    await update('task', { ...args, id })
  }

  return await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${id}`)
}

// TODO: make sure that the user can delete the task
export async function deleteTask(id: number) {
  const db = await getDatabase()
  const task = await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${id}`)

  if (!task) {
    return null
  }

  await remove('task', { id })

  return task
}
