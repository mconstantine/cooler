import { Task } from './Task'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'

// TODO: make sure that the project is owned by the user
export async function createTask(task: Partial<Task>) {
  const db = await getDatabase()
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
      ([, value]) => !!value
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
