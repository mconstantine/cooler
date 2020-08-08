import { Task } from './Task'
import { getDatabase } from '../misc/getDatabase'
import { insert } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'

export async function createTask(task: Partial<Task>) {
  const db = await getDatabase()
  const { lastID } = await insert('task', {
    ...task,
    actualWorkingHours: task.actualWorkingHours || 0
  })

  return await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${lastID}`)
}

export async function listTasks(args: ConnectionQueryArgs & { description?: string }) {
  return await queryToConnection(
    args,
    ['*'],
    'task',
    args.description ? SQL`WHERE description like ${`%${args.description}%`}` : undefined
  )
}
