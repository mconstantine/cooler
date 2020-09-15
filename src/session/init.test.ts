import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, remove, toSQLDate, update } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeTask, getFakeTaskFromDatabase } from '../test/getFakeTask'
import { getFakeSessionFromDatabase } from '../test/getFakeSession'
import SQL from 'sql-template-strings'
import { Task } from '../task/interface'
import { Project, ProjectFromDatabase } from '../project/interface'
import { init } from '../init'
import { ID } from '../misc/Types'
import { definitely } from '../misc/definitely'
import { sleep } from '../test/sleep'
import { getID } from '../test/getID'

describe('init', () => {
  let db: Database
  let user: ID
  let client: ID

  beforeAll(async () => {
    await init()
    db = await getDatabase()
  })

  describe('happy path', () => {
    it('should create a database table', async () => {
      await db.all('SELECT * FROM session')
    })

    it("should delete all task's sessions when a task is deleted", async () => {
      user = await getID('user', getFakeUser())
      client = await getID('client', getFakeClient(user))

      const project = await getID('project', getFakeProject(client))
      const task = await getID('task', getFakeTaskFromDatabase(project))
      const sessionId = await getID('session', getFakeSessionFromDatabase(task))

      await remove('task', { id: task })

      const session = await db.get(
        SQL`SELECT * FROM session WHERE id = ${sessionId}`
      )

      expect(session).toBeUndefined()
    })
  })

  describe('project cashed balance default', () => {
    it('should calculate the cashed balance from the sessions by default', async () => {
      const projectId = await getID(
        'project',
        getFakeProject(client, {
          cashed_at: null
        })
      )

      const taskId = await getID(
        'task',
        getFakeTask(projectId, {
          hourlyCost: 10.5
        })
      )

      const now = new Date()

      await insert(
        'session',
        getFakeSessionFromDatabase(taskId, {
          start_time: toSQLDate(now),
          end_time: toSQLDate(new Date(now.getTime() + 1000 * 60 * 60 * 4))
        })
      )

      await update('project', {
        id: projectId,
        cashed_at: toSQLDate(new Date())
      })

      const project = definitely(
        await db.get<ProjectFromDatabase>(
          SQL`SELECT * FROM project WHERE ${projectId}`
        )
      )

      expect(project.cashed_balance).toBe(42)
    })
  })

  describe('deletion chain', () => {
    it('should make user deletion bubble down to sessions', async () => {
      const user = await getID('user', getFakeUser())
      const client = await getID('client', getFakeClient(user))
      const project = await getID('project', getFakeProject(client))
      const task = await getID('task', getFakeTaskFromDatabase(project))
      const sessionId = await getID('session', getFakeSessionFromDatabase(task))

      await remove('user', { id: user })

      const session = await db.get(
        SQL`SELECT * FROM session WHERE id = ${sessionId}`
      )

      expect(session).toBeUndefined()
    })
  })

  describe('update chain', () => {
    it('should update the task and project when a session is created for them', async () => {
      const user = await getID('user', getFakeUser())
      const client = await getID('client', getFakeClient(user))
      const project = await getID('project', getFakeProject(client))
      const task = await getID('task', getFakeTaskFromDatabase(project))

      const projectUpdatedAtBefore = definitely(
        await db.get<Project>(
          SQL`SELECT updated_at FROM project WHERE id = ${project}`
        )
      ).updated_at

      const taskUpdatedAtBefore = definitely(
        await db.get<Task>(SQL`SELECT updated_at FROM task WHERE id = ${task}`)
      ).updated_at

      await sleep(1000)
      await insert('session', getFakeSessionFromDatabase(task))

      const projectUpdatedAtAfter = definitely(
        await db.get<Project>(
          SQL`SELECT updated_at FROM project WHERE id = ${project}`
        )
      ).updated_at

      const taskUpdatedAtAfter = definitely(
        await db.get<Task>(SQL`SELECT updated_at FROM task WHERE id = ${task}`)
      ).updated_at

      expect(projectUpdatedAtBefore).not.toBe(projectUpdatedAtAfter)
      expect(taskUpdatedAtBefore).not.toBe(taskUpdatedAtAfter)
    })
  })
})
