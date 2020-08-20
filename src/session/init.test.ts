import initUser from '../user/init'
import initClient from '../client/init'
import initProject from '../project/init'
import initTask from '../task/init'
import initSession from '../session/init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, remove } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeTask } from '../test/getFakeTask'
import { getFakeSession } from '../test/getFakeSession'
import SQL from 'sql-template-strings'
import { Task } from '../task/Task'
import { Project } from '../project/Project'

describe('init', () => {
  let db: Database

  beforeAll(async () => {
    await initUser()
    await initClient()
    await initProject()
    await initTask()
    await initSession()
    db = await getDatabase()
  })

  describe('happy path', () => {
    it('should create a database table', async () => {
      await db.all('SELECT * FROM session')
    })

    it("should delete all task's sessions when a task is deleted", async () => {
      const user = (
        await insert('user', getFakeUser())
      ).lastID!

      const client = (
        await insert('client', getFakeClient({ user }))
      ).lastID!

      const project = (
        await insert('project', getFakeProject({ client }))
      ).lastID!

      const task = (
        await insert('task', getFakeTask({ project }))
      ).lastID!

      const sessionId = (
        await insert('session', getFakeSession({ task }))
      ).lastID!

      await remove('task', { id: task })
      const session = await db.get(SQL`SELECT * FROM session WHERE id = ${sessionId}`)
      expect(session).toBeUndefined()
    })
  })

  describe('deletion chain', () => {
    it('should make user deletion bubble down to sessions', async () => {
      const user = (
        await insert('user', getFakeUser())
      ).lastID!

      const client = (
        await insert('client', getFakeClient({ user }))
      ).lastID!

      const project = (
        await insert('project', getFakeProject({ client }))
      ).lastID!

      const task = (
        await insert('task', getFakeTask({ project }))
      ).lastID!

      const sessionId = (
        await insert('session', getFakeSession({ task }))
      ).lastID!

      await remove('user', { id: user })
      const session = await db.get(SQL`SELECT * FROM session WHERE id = ${sessionId}`)
      expect(session).toBeUndefined()
    })
  })

  describe('update chain', () => {
    it('should update the task and project when a session is created for them', async () => {
      const user = (
        await insert('user', getFakeUser())
      ).lastID!

      const client = (
        await insert('client', getFakeClient({ user }))
      ).lastID!

      const project = (
        await insert('project', getFakeProject({ client }))
      ).lastID!

      const task = (
        await insert('task', getFakeTask({ project }))
      ).lastID!

      const projectUpdatedAtBefore = (
        await db.get<Project>(SQL`SELECT updated_at FROM project WHERE id = ${project}`)
      )!.updated_at

      const taskUpdatedAtBefore = (
        await db.get<Task>(SQL`SELECT updated_at FROM task WHERE id = ${task}`)
      )!.updated_at

      await (() => new Promise(done => setTimeout(() => done(), 1000)))()
      await insert('session', getFakeSession({ task }))

      const projectUpdatedAtAfter = (
        await db.get<Project>(SQL`SELECT updated_at FROM project WHERE id = ${project}`)
      )!.updated_at

      const taskUpdatedAtAfter = (
        await db.get<Task>(SQL`SELECT updated_at FROM task WHERE id = ${task}`)
      )!.updated_at

      expect(projectUpdatedAtBefore).not.toBe(projectUpdatedAtAfter)
      expect(taskUpdatedAtBefore).not.toBe(taskUpdatedAtAfter)
    })
  })
})
