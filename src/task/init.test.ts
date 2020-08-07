import init from './init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update } from '../misc/dbUtils'
import { getFakeTask } from '../test/getFakeTask'
import SQL from 'sql-template-strings'
import { Task } from './Task'

describe('initTask', () => {
  describe('happy path', () => {
    let db: Database

    beforeAll(async () => {
      db = await getDatabase()
      await init()
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM task')
    })

    it('should create a database table for the task-project relationship', async () => {
      await db.exec('SELECT * FROM task_project')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('task', getFakeTask())
      const task = await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${lastID}`)

      expect(task!.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const task = getFakeTask()
      const updated: Partial<Task> = { description: 'Some weird description' }

      expect(task.description).not.toBe(updated.description)

      const { lastID } = await insert('task', task)

      const updateDateBefore = (
        await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${lastID}`)
      )!.updated_at

      await (() => new Promise(done => setTimeout(() => done(), 1000)))()
      await update('task', { id: lastID, ...updated })

      const updateDateAfter = (
        await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${lastID}`)
      )!.updated_at

      expect(updateDateBefore).not.toBe(updateDateAfter)
    })
  })
})
