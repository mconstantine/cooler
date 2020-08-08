import { Task } from './Task'
import { getDatabase } from '../misc/getDatabase'
import { insert } from '../misc/dbUtils'
import SQL from 'sql-template-strings'

export async function createTask(task: Partial<Task>) {
  const db = await getDatabase()
  const { lastID } = await insert('task', {
    ...task,
    actualWorkingHours: task.actualWorkingHours || 0
  })

  return await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${lastID}`)
}
