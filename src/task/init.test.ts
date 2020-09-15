import { init } from '../init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update, remove } from '../misc/dbUtils'
import { getFakeTask } from '../test/getFakeTask'
import SQL from 'sql-template-strings'
import { TaskFromDatabase } from './interface'
import { ProjectFromDatabase } from '../project/interface'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeClient } from '../test/getFakeClient'
import { ClientFromDatabase } from '../client/interface'
import { getFakeUser } from '../test/getFakeUser'
import { getID } from '../test/getID'
import { definitely } from '../misc/definitely'
import { sleep } from '../test/sleep'

describe('initTask', () => {
  let project: ProjectFromDatabase
  let db: Database

  beforeAll(async () => {
    await init()
    db = await getDatabase()
  })

  describe('happy path', () => {
    let client: ClientFromDatabase

    beforeAll(async () => {
      const userData = getFakeUser()
      const userId = await getID('user', userData)
      const clientData = getFakeClient(userId)
      const clientId = await getID('client', clientData)
      const projectData = getFakeProject(clientId)
      const projectId = await getID('project', projectData)

      project = definitely(
        await db.get<ProjectFromDatabase>(
          SQL`SELECT * FROM project WHERE id = ${projectId}`
        )
      )

      client = definitely(
        await db.get<ClientFromDatabase>(
          SQL`SELECT * FROM client WHERE id = ${clientId}`
        )
      )
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM task')
    })

    it('should save the creation time automatically', async () => {
      const lastID = await getID('task', getFakeTask(project.id))

      const task = definitely(
        await db.get<TaskFromDatabase>(
          SQL`SELECT * FROM task WHERE id = ${lastID}`
        )
      )

      expect(task.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const task = getFakeTask(project.id)
      const updated = { name: 'Some weird name' }

      expect(task.name).not.toBe(updated.name)

      const lastID = await getID('task', task)

      const updateDateBefore = definitely(
        await db.get<TaskFromDatabase>(
          SQL`SELECT * FROM task WHERE id = ${lastID}`
        )
      ).updated_at

      await sleep(1000)
      await update('task', { id: lastID, ...updated })

      const updateDateAfter = definitely(
        await db.get<TaskFromDatabase>(
          SQL`SELECT * FROM task WHERE id = ${lastID}`
        )
      ).updated_at

      expect(updateDateBefore).not.toBe(updateDateAfter)
    })

    it("should delete all project's tasks when a project is deleted", async () => {
      const projectData = getFakeProject(client.id)
      const projectId = await getID('project', projectData)
      const taskData = getFakeTask(projectId)
      const taskId1 = await getID('task', taskData)

      await remove('project', { id: projectId })

      const task = await db.get<TaskFromDatabase>(
        SQL`SELECT * FROM task WHERE id = ${taskId1}`
      )

      expect(task).toBeUndefined()
    })
  })

  describe('deletion chain', () => {
    it('should make user deletion bubble down to tasks', async () => {
      const userData = getFakeUser()
      const userId = await getID('user', userData)
      const clientData = getFakeClient(userId)
      const clientId = await getID('client', clientData)
      const projectData = getFakeProject(clientId)
      const projectId = await getID('project', projectData)
      const taskData = getFakeTask(projectId)
      const taskId = await getID('task', taskData)

      await remove('user', { id: userId })

      const task = await db.get<TaskFromDatabase>(
        SQL`SELECT * FROM task WHERE id = ${taskId}`
      )

      expect(task).toBeUndefined()
    })
  })

  describe('project update', () => {
    it('should update the project when a task is created for it', async () => {
      const projectUpdatedAtBefore = definitely(
        await db.get<ProjectFromDatabase>(
          SQL`SELECT * FROM project WHERE id = ${project.id}`
        )
      ).updated_at

      await sleep(1000)
      await insert('task', getFakeTask(project.id))

      const projectUpdatedAtAfter = definitely(
        await db.get<ProjectFromDatabase>(
          SQL`SELECT * FROM project WHERE id = ${project.id}`
        )
      ).updated_at

      expect(projectUpdatedAtBefore).not.toBe(projectUpdatedAtAfter)
    })
  })
})
