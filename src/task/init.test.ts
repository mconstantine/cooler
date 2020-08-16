import init from './init'
import initProject from '../project/init'
import initClient from '../client/init'
import initUser from '../user/init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update, remove } from '../misc/dbUtils'
import { getFakeTask } from '../test/getFakeTask'
import SQL from 'sql-template-strings'
import { Task } from './Task'
import { Project } from '../project/Project'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeClient } from '../test/getFakeClient'
import { Client } from '../client/Client'
import { getFakeUser } from '../test/getFakeUser'

describe('initTask', () => {
  let project: Project
  let db: Database

  beforeAll(async () => {
    db = await getDatabase()

    await initUser()
    await initClient()
    await initProject()
    await init()
  })

  describe('happy path', () => {
    let client: Client

    beforeAll(async () => {
      const userData = getFakeUser()
      const { lastID: userId } = await insert('user', userData)
      const clientData = getFakeClient({ user: userId })
      const { lastID: clientId } = await insert('client', clientData)
      const projectData = getFakeProject({ client: clientId }) as Project
      const { lastID: projectId } = await insert('project', projectData)

      project = { ...projectData, id: projectId! }
      client = { ...clientData, id: clientId! } as Client
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM task')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('task', getFakeTask({ project: project.id }))
      const task = await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${lastID}`)

      expect(task!.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const task = getFakeTask({ project: project.id })
      const updated: Partial<Task> = { name: 'Some weird name' }

      expect(task.name).not.toBe(updated.name)

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

    it("should delete all project's tasks when a project is deleted", async () => {
      const projectData = getFakeProject({ client: client.id })
      const { lastID: projectId } = await insert('project', projectData)
      const taskData = getFakeTask({ project: projectId })
      const { lastID: taskId1 } = await insert('task', taskData)

      await remove('project', { id: projectId })

      const task = await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${taskId1}`)

      expect(task).toBeUndefined()
    })
  })

  describe('deletion chain', () => {
    it('should make user deletion bubble down to tasks', async () => {
      const userData = getFakeUser()
      const { lastID: userId } = await insert('user', userData)
      const clientData = getFakeClient({ user: userId })
      const { lastID: clientId } = await insert('client', clientData)
      const projectData = getFakeProject({ client: clientId })
      const { lastID: projectId } = await insert('project', projectData)
      const taskData = getFakeTask({ project: projectId })
      const { lastID: taskId } = await insert('task', taskData)

      await remove('user', { id: userId })

      const task = await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${taskId}`)

      expect(task).toBeUndefined()
    })
  })

  describe('project update', () => {
    it('should update the project where a task is created for it', async () => {
      const projectUpdatedAtBefore = (
        await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${project.id}`)
      )!.updated_at

      await (() => new Promise(done => setTimeout(() => done(), 1000)))()
      await insert('task', getFakeTask({ project: project.id }))

      const projectUpdatedAtAfter = (
        await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${project.id}`)
      )!.updated_at

      expect(projectUpdatedAtBefore).not.toBe(projectUpdatedAtAfter)
    })
  })
})
