import { init } from '../init'
import resolvers from './resolvers'
import { insert, toSQLDate, remove } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeTask } from '../test/getFakeTask'
import { getFakeSession } from '../test/getFakeSession'
import { Task } from '../task/Task'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { User } from '../user/User'
import { Project } from '../project/Project'
import { Database } from 'sqlite'

describe('session resolvers', () => {
  let db: Database
  let user: User
  let project: Project

  beforeAll(async () => {
    await init()
    db = await getDatabase()

    const userId = (await insert('user', getFakeUser())).lastID!
    const clientId = (await insert('client', getFakeClient({ user: userId }))).lastID!
    const projectId = (await insert('project', getFakeProject({ client: clientId }))).lastID!

    user = (await db.get<User>(SQL`SELECT * FROM user WHERE id = ${userId}`))!
    project = (await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${projectId}`))!
  })

  describe('Task', () => {
    let task: Task

    beforeAll(async () => {
      const taskId = (await insert('task', getFakeTask({
        project: project.id,
        expectedWorkingHours: 10,
        hourlyCost: 50
      }))).lastID!

      task = (await db.get<Task>(SQL`SELECT * FROM task WHERE id = ${taskId}`))!

      // 1 hour
      await insert('session', getFakeSession({
        task: task.id,
        start_time: toSQLDate(new Date('1990-01-01T00:00:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T01:00:00.000Z'))
      }))

      // 2 hours
      await insert('session', getFakeSession({
        task: task.id,
        start_time: toSQLDate(new Date('1990-01-01T01:00:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T03:00:00.000Z'))
      }))

      // 1.5 hours
      await insert('session', getFakeSession({
        task: task.id,
        start_time: toSQLDate(new Date('1990-01-01T04:00:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T05:30:00.000Z'))
      }))
    })

    describe('actualWorkingHours', () => {
      it('should work', async () => {
        const actualWorkingHours = await resolvers.Task.actualWorkingHours(
          task, {}, { user }, null as any
        )

        expect(actualWorkingHours).toBe(4.5)
      })
    })

    describe('budget', () => {
      it('should work', async () => {
        const budget = await resolvers.Task.budget(task, {}, { user }, null as any)
        expect(budget).toBe(500)
      })
    })

    describe('balance', () => {
      it('should work', async () => {
        const balance = await resolvers.Task.balance(task, {}, { user }, null as any)
        expect(balance).toBe(225)
      })
    })
  })

  describe('Project', () => {
    beforeAll(async () => {
      await remove('task', { project: project.id })

      const task1Id = (await insert('task', getFakeTask({
        project: project.id,
        expectedWorkingHours: 10,
        hourlyCost: 25
      }))).lastID!

      const task2Id = (await insert('task', getFakeTask({
        project: project.id,
        expectedWorkingHours: 5,
        hourlyCost: 30
      }))).lastID!

      const task3Id = (await insert('task', getFakeTask({
        project: project.id,
        expectedWorkingHours: 20,
        hourlyCost: 10
      }))).lastID!

      // 3 hours
      await insert('session', getFakeSession({
        task: task1Id,
        start_time: toSQLDate(new Date('1990-01-01T00:00:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T03:00:00.000Z'))
      }))

      // 1.5 hours
      await insert('session', getFakeSession({
        task: task1Id,
        start_time: toSQLDate(new Date('1990-01-01T03:00:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T04:30:00.000Z'))
      }))

      // 2 hours
      await insert('session', getFakeSession({
        task: task1Id,
        start_time: toSQLDate(new Date('1990-01-01T04:30:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T06:30:00.000Z'))
      }))

      // 6 hours
      await insert('session', getFakeSession({
        task: task2Id,
        start_time: toSQLDate(new Date('1990-01-01T06:30:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T12:30:00.000Z'))
      }))

      // 5 hours
      await insert('session', getFakeSession({
        task: task2Id,
        start_time: toSQLDate(new Date('1990-01-01T12:30:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T17:30:00.000Z'))
      }))

      // 1.25 hours
      await insert('session', getFakeSession({
        task: task2Id,
        start_time: toSQLDate(new Date('1990-01-01T17:30:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T18:45:00.000Z'))
      }))

      // 2 hours
      await insert('session', getFakeSession({
        task: task3Id,
        start_time: toSQLDate(new Date('1990-01-01T18:45:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T20:45:00.000Z'))
      }))

      // 3 hours
      await insert('session', getFakeSession({
        task: task3Id,
        start_time: toSQLDate(new Date('1990-01-01T20:45:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T23:45:00.000Z'))
      }))

      // 0.25 hours
      await insert('session', getFakeSession({
        task: task3Id,
        start_time: toSQLDate(new Date('1990-01-01T23:45:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-02T00:00:00.000Z'))
      }))
    })

    describe('expectedWorkingHours', () => {
      it('should work', async () => {
        const expectedWorkingHours = await resolvers.Project.expectedWorkingHours(
          project, {}, { user }, null as any
        )

        expect(expectedWorkingHours).toBe(35)
      })
    })

    describe('actualWorkingHours', () => {
      it('should work', async () => {
        const actualWorkingHours = await resolvers.Project.actualWorkingHours(
          project, {}, { user }, null as any
        )

        expect(actualWorkingHours).toBe(24)
      })
    })

    describe('budget', () => {
      it('should work', async () => {
        const budget = await resolvers.Project.budget(project, {}, { user }, null as any)
        expect(budget).toBe(600)
      })
    })

    describe('balance', () => {
      it('should work', async () => {
        const balance = await resolvers.Project.balance(project, {}, { user }, null as any)
        expect(balance).toBe(582.5)
      })
    })
  })

  describe('User', () => {
    let user: User
    const since = toSQLDate(new Date('1990-01-01T04:30:00.000Z'))

    beforeAll(async () => {
      const { lastID } = (await insert('user', getFakeUser()))!

      user = (await db.get<User>(SQL`SELECT * FROM user WHERE id = ${lastID}`))!

      const client1Id = (await insert('client', getFakeClient({ user: user.id }))).lastID!
      const client2Id = (await insert('client', getFakeClient({ user: user.id }))).lastID!

      const project1Id = (await insert('project', getFakeProject({
        client: client1Id,
        cashed_at: null
      }))).lastID!

      const project2Id = (await insert('project', getFakeProject({
        client: client2Id,
        cashed_at: toSQLDate(new Date())
      }))).lastID!

      const task1Id = (await insert('task', getFakeTask({
        project: project1Id,
        expectedWorkingHours: 10,
        hourlyCost: 25,
        start_time: toSQLDate(new Date('1990-01-01T00:00:00.000Z'))
      }))!).lastID

      const task2Id = (await insert('task', getFakeTask({
        project: project1Id,
        expectedWorkingHours: 5,
        hourlyCost: 30,
        start_time: toSQLDate(new Date('1990-01-01T06:30:00.000Z'))
      }))!).lastID

      const task3Id = (await insert('task', getFakeTask({
        project: project2Id,
        expectedWorkingHours: 20,
        hourlyCost: 10,
        start_time: toSQLDate(new Date('1990-01-01T18:45:00.000Z'))
      }))!).lastID

      // 3 hours - not taken into consideration as "since" is before this
      await insert('session', getFakeSession({
        task: task1Id,
        start_time: toSQLDate(new Date('1990-01-01T00:00:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T03:00:00.000Z'))
      }))

      // 1.5 hours - not taken into consideration as "since" is before this
      await insert('session', getFakeSession({
        task: task1Id,
        start_time: toSQLDate(new Date('1990-01-01T03:00:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T04:30:00.000Z'))
      }))

      // 2 hours
      await insert('session', getFakeSession({
        task: task1Id,
        start_time: toSQLDate(new Date('1990-01-01T04:30:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T06:30:00.000Z'))
      }))

      // 6 hours
      await insert('session', getFakeSession({
        task: task2Id,
        start_time: toSQLDate(new Date('1990-01-01T06:30:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T12:30:00.000Z'))
      }))

      // 5 hours
      await insert('session', getFakeSession({
        task: task2Id,
        start_time: toSQLDate(new Date('1990-01-01T12:30:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T17:30:00.000Z'))
      }))

      // 1.25 hours
      await insert('session', getFakeSession({
        task: task2Id,
        start_time: toSQLDate(new Date('1990-01-01T17:30:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T18:45:00.000Z'))
      }))

      // 2 hours - not taken into consideration as project 2 is cashed
      await insert('session', getFakeSession({
        task: task3Id,
        start_time: toSQLDate(new Date('1990-01-01T18:45:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T20:45:00.000Z'))
      }))

      // 3 hours - not taken into consideration as project 2 is cashed
      await insert('session', getFakeSession({
        task: task3Id,
        start_time: toSQLDate(new Date('1990-01-01T20:45:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-01T23:45:00.000Z'))
      }))

      // 0.25 hours - not taken into consideration as project 2 is cashed
      await insert('session', getFakeSession({
        task: task3Id,
        start_time: toSQLDate(new Date('1990-01-01T23:45:00.000Z')),
        end_time: toSQLDate(new Date('1990-01-02T00:00:00.000Z'))
      }))
    })

    describe('expectedWorkingHours', () => {
      it('should work', async () => {
        const expectedWorkingHours = await resolvers.User.expectedWorkingHours(
          user, { since }, { user }, null as any
        )

        expect(expectedWorkingHours).toBe(5)
      })
    })

    describe('actualWorkingHours', () => {
      it('should work', async () => {
        const actualWorkingHours = await resolvers.User.actualWorkingHours(
          user, { since }, { user }, null as any
        )

        expect(actualWorkingHours).toBe(14.25)
      })
    })

    describe('budget', () => {
      it('should work', async () => {
        const budget = await resolvers.User.budget(user, { since }, { user }, null as any)
        expect(budget).toBe(150)
      })
    })

    describe('balance', () => {
      it('should work', async () => {
        const balance = await resolvers.User.balance(user, { since }, { user }, null as any)
        expect(balance).toBe(417.5)
      })
    })
  })
})
