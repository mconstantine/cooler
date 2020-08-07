import init from './init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update } from '../misc/dbUtils'
import { getFakeProject } from '../test/getFakeProject'
import SQL from 'sql-template-strings'
import { Project } from './Project'

describe('initProject', () => {
  describe('happy path', () => {
    let db: Database

    beforeAll(async () => {
      db = await getDatabase()
      await init()
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM project')
    })

    it('should create a database table for the project-client relationship', async () => {
      await db.exec('SELECT * FROM project_client')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('project', getFakeProject())
      const project = await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${lastID}`)

      expect(project!.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const project = getFakeProject()
      const updated: Partial<Project> = { name: 'Some weird name' }

      expect(project.name).not.toBe(updated.name)

      const { lastID } = await insert('project', project)

      const updateDateBefore = (
        await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${lastID}`)
      )!.updated_at

      await (() => new Promise(done => setTimeout(() => done(), 1000)))()
      await update('project', { id: lastID, ...updated })

      const updateDateAfter = (
        await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${lastID}`)
      )!.updated_at

      expect(updateDateBefore).not.toBe(updateDateAfter)
    })
  })
})
