import init from './init'
import initClient from '../client/init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update, remove } from '../misc/dbUtils'
import { getFakeProject } from '../test/getFakeProject'
import SQL from 'sql-template-strings'
import { Project } from './Project'
import { Client } from '../client/Client'
import { getFakeClient } from '../test/getFakeClient'

describe('initProject', () => {
  describe('happy path', () => {
    let db: Database
    let client: Client

    beforeAll(async () => {
      db = await getDatabase()

      await initClient()
      await init()

      const clientData = getFakeClient()
      const { lastID } = await insert('client', clientData)

      client = { ...clientData, id: lastID! } as Client
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM project')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('project', getFakeProject({ client: client.id }))
      const project = await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${lastID}`)

      expect(project!.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const project = getFakeProject({ client: client.id })
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

    it("should delete all client's projects when the client is deleted", async () => {
      const clientData = getFakeClient()
      const { lastID: clientId } = await insert('client', clientData)
      const projectData = getFakeProject({ client: clientId })
      const { lastID: projectId } = await insert('project', projectData)

      await remove('client', { id: clientId })

      const project = await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${projectId}`)

      expect(project).toBeUndefined()
    })
  })
})
