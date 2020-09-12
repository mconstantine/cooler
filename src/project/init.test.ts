import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update, remove, toSQLDate } from '../misc/dbUtils'
import { getFakeProject } from '../test/getFakeProject'
import SQL from 'sql-template-strings'
import { Project, ProjectFromDatabase } from './interface'
import { Client } from '../client/interface'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeUser } from '../test/getFakeUser'
import { User } from '../user/interface'
import { init } from '../init'
import { getFakeTask } from '../test/getFakeTask'
import { getFakeSession } from '../test/getFakeSession'
import { fromDatabase } from './model'

describe('initProject', () => {
  describe('happy path', () => {
    let db: Database
    let client: Client
    let user: User

    beforeAll(async () => {
      db = await getDatabase()

      await init()

      const userData = getFakeUser()
      const { lastID: userId } = await insert('user', userData)
      const clientData = getFakeClient(userId!)
      const { lastID: clientId } = await insert('client', clientData)

      user = { ...userData, id: userId! } as User
      client = { ...clientData, id: clientId! } as Client
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM project')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('project', getFakeProject(client.id))
      const project = await db.get<ProjectFromDatabase>(
        SQL`SELECT * FROM project WHERE id = ${lastID}`
      )

      expect(project!.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      )
    })

    it('should keep track of the time of the last update', async () => {
      const project = getFakeProject(client.id)
      const updated: Partial<Project> = { name: 'Some weird name' }

      expect(project.name).not.toBe(updated.name)

      const { lastID } = await insert('project', project)

      const updateDateBefore = (await db.get<ProjectFromDatabase>(
        SQL`SELECT * FROM project WHERE id = ${lastID}`
      ))!.updated_at

      await (() => new Promise(done => setTimeout(() => done(), 1000)))()
      await update('project', { id: lastID, ...updated })

      const updateDateAfter = (await db.get<ProjectFromDatabase>(
        SQL`SELECT * FROM project WHERE id = ${lastID}`
      ))!.updated_at

      expect(updateDateBefore).not.toBe(updateDateAfter)
    })

    it("should delete all client's projects when the client is deleted", async () => {
      const clientData = getFakeClient(user.id)
      const { lastID: clientId } = await insert('client', clientData)
      const projectData = getFakeProject(clientId!)
      const { lastID: projectId } = await insert('project', projectData)

      await remove('client', { id: clientId })

      const project = await db.get<ProjectFromDatabase>(
        SQL`SELECT * FROM project WHERE id = ${projectId}`
      )

      expect(project).toBeUndefined()
    })

    it('should set cashed_balance to null if cashed_date is set to null', async () => {
      let project: Project

      const { lastID } = await insert(
        'project',
        getFakeProject(client.id, { cashed_at: null })
      )

      const getProject = async () =>
        fromDatabase(
          (await db.get<ProjectFromDatabase>(
            SQL`SELECT * FROM project WHERE id = ${lastID}`
          ))!
        )

      project = await getProject()
      expect(project.cashed_at).toBeNull()
      expect(project.cashed_balance).toBeNull()

      await update('project', {
        id: project.id,
        cashed_at: toSQLDate(new Date()),
        cashed_balance: 42
      })

      project = await getProject()
      expect(project.cashed_at).not.toBeNull()
      expect(project.cashed_balance).not.toBeNull()

      await update('project', { id: project.id, cashed_at: null })

      project = await getProject()
      expect(project.cashed_at).toBeNull()
      expect(project.cashed_balance).toBeNull()
    })

    // FIXME: this should be in the session stuff
    it('should calculate the cashed balance from the sessions by default', async () => {
      const { lastID: projectId } = await insert(
        'project',
        getFakeProject(client.id, {
          cashed_at: null
        })
      )

      const { lastID: taskId } = await insert(
        'task',
        getFakeTask({
          project: projectId,
          hourlyCost: 10.5
        })
      )

      const now = new Date()

      await insert(
        'session',
        getFakeSession({
          task: taskId,
          start_time: toSQLDate(now),
          end_time: toSQLDate(new Date(now.getTime() + 1000 * 60 * 60 * 4))
        })
      )

      await update('project', {
        id: projectId,
        cashed_at: toSQLDate(new Date())
      })

      const project = await db.get<ProjectFromDatabase>(
        SQL`SELECT * FROM project WHERE ${projectId}`
      )

      expect(project!.cashed_balance).toBe(42)
    })

    it('should set the cashed balance to zero if there are no sessions', async () => {
      const { lastID: projectId } = await insert(
        'project',
        getFakeProject(client.id, {
          cashed_at: null
        })
      )

      await update('project', {
        id: projectId,
        cashed_at: toSQLDate(new Date())
      })

      const project = await db.get<ProjectFromDatabase>(
        SQL`SELECT * FROM project WHERE ${projectId}`
      )
      expect(project!.cashed_balance).toBe(0)
    })
  })
})
