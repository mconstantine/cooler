import { init } from '../init'
import resolvers from './resolvers'
import { insert, toSQLDate, remove } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeTask, getFakeTaskFromDatabase } from '../test/getFakeTask'
import { getFakeSessionFromDatabase } from '../test/getFakeSession'
import { TaskFromDatabase } from '../task/interface'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { User, UserFromDatabase } from '../user/interface'
import { ProjectFromDatabase } from '../project/interface'
import { Database } from 'sqlite'
import {
  fromDatabase as userFromDatabase,
  toDatabase as userToDatabase
} from '../user/model'
import { definitely } from '../misc/definitely'

describe('session resolvers', () => {
  let db: Database
  let user: User
  let project: ProjectFromDatabase

  beforeAll(async () => {
    await init()
    db = await getDatabase()

    const userId = definitely((await insert('user', getFakeUser())).lastID)

    const clientId = definitely(
      (await insert('client', getFakeClient(userId))).lastID
    )

    const projectId = definitely(
      (await insert('project', getFakeProject(clientId))).lastID
    )

    user = definitely(
      await db.get<User>(SQL`SELECT * FROM user WHERE id = ${userId}`)
    )

    project = definitely(
      await db.get<ProjectFromDatabase>(
        SQL`SELECT * FROM project WHERE id = ${projectId}`
      )
    )
  })

  describe('Task', () => {
    let task: TaskFromDatabase

    beforeAll(async () => {
      const taskId = definitely(
        (
          await insert(
            'task',
            getFakeTaskFromDatabase(project.id, {
              expectedWorkingHours: 10,
              hourlyCost: 50
            })
          )
        ).lastID
      )

      task = definitely(
        await db.get<TaskFromDatabase>(
          SQL`SELECT * FROM task WHERE id = ${taskId}`
        )
      )
    })

    describe('empty state', () => {
      it('should work', async () => {
        const actualWorkingHours = await resolvers.Task.actualWorkingHours(
          task,
          {},
          { user },
          null as any
        )

        const budget = await resolvers.Task.budget(
          task,
          {},
          { user },
          null as any
        )
        const balance = await resolvers.Task.balance(
          task,
          {},
          { user },
          null as any
        )

        expect(actualWorkingHours).toBe(0)
        expect(budget).toBe(500)
        expect(balance).toBe(0)
      })
    })

    describe('with sessions', () => {
      beforeAll(async () => {
        // 1 hour
        await insert(
          'session',
          getFakeSessionFromDatabase(task.id, {
            start_time: toSQLDate(new Date('1990-01-01T00:00:00.000Z')),
            end_time: toSQLDate(new Date('1990-01-01T01:00:00.000Z'))
          })
        )

        // 2 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task.id, {
            start_time: toSQLDate(new Date('1990-01-01T01:00:00.000Z')),
            end_time: toSQLDate(new Date('1990-01-01T03:00:00.000Z'))
          })
        )

        // 1.5 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task.id, {
            start_time: toSQLDate(new Date('1990-01-01T04:00:00.000Z')),
            end_time: toSQLDate(new Date('1990-01-01T05:30:00.000Z'))
          })
        )
      })

      describe('actualWorkingHours', () => {
        it('should work', async () => {
          const actualWorkingHours = await resolvers.Task.actualWorkingHours(
            task,
            {},
            { user },
            null as any
          )

          expect(actualWorkingHours).toBe(4.5)
        })
      })

      describe('budget', () => {
        it('should work', async () => {
          const budget = await resolvers.Task.budget(
            task,
            {},
            { user },
            null as any
          )
          expect(budget).toBe(500)
        })
      })

      describe('balance', () => {
        it('should work', async () => {
          const balance = await resolvers.Task.balance(
            task,
            {},
            { user },
            null as any
          )
          expect(balance).toBe(225)
        })
      })
    })
  })

  describe('Project', () => {
    beforeAll(async () => {
      await remove('task', { project: project.id })
    })

    describe('empty state', () => {
      it('should work', async () => {
        const expectedWorkingHours = await resolvers.Project.expectedWorkingHours(
          project,
          {},
          { user },
          null as any
        )

        const actualWorkingHours = await resolvers.Project.actualWorkingHours(
          project,
          {},
          { user },
          null as any
        )

        const budget = await resolvers.Project.budget(
          project,
          {},
          { user },
          null as any
        )
        const balance = await resolvers.Project.balance(
          project,
          {},
          { user },
          null as any
        )

        expect(expectedWorkingHours).toBe(0)
        expect(actualWorkingHours).toBe(0)
        expect(budget).toBe(0)
        expect(balance).toBe(0)
      })
    })

    describe('with tasks', () => {
      beforeAll(async () => {
        const task1Id = definitely(
          (
            await insert(
              'task',
              getFakeTask(project.id, {
                expectedWorkingHours: 10,
                hourlyCost: 25
              })
            )
          ).lastID
        )

        const task2Id = definitely(
          (
            await insert(
              'task',
              getFakeTask(project.id, {
                expectedWorkingHours: 5,
                hourlyCost: 30
              })
            )
          ).lastID
        )

        const task3Id = definitely(
          (
            await insert(
              'task',
              getFakeTask(project.id, {
                expectedWorkingHours: 20,
                hourlyCost: 10
              })
            )
          ).lastID
        )

        // 3 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task1Id, {
            start_time: '1990-01-01 00:00:00',
            end_time: '1990-01-01 03:00:00'
          })
        )

        // 1.5 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task1Id, {
            start_time: '1990-01-01 03:00:00',
            end_time: '1990-01-01 04:30:00'
          })
        )

        // 2 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task1Id, {
            start_time: '1990-01-01 04:30:00',
            end_time: '1990-01-01 06:30:00'
          })
        )

        // 6 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task2Id, {
            start_time: '1990-01-01 06:30:00',
            end_time: '1990-01-01 12:30:00'
          })
        )

        // 5 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task2Id, {
            start_time: '1990-01-01 12:30:00',
            end_time: '1990-01-01 17:30:00'
          })
        )

        // 1.25 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task2Id, {
            start_time: '1990-01-01 17:30:00',
            end_time: '1990-01-01 18:45:00'
          })
        )

        // 2 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task3Id, {
            start_time: '1990-01-01 18:45:00',
            end_time: '1990-01-01 20:45:00'
          })
        )

        // 3 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task3Id, {
            start_time: '1990-01-01 20:45:00',
            end_time: '1990-01-01 23:45:00'
          })
        )

        // 0.25 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task3Id, {
            start_time: '1990-01-01 23:45:00',
            end_time: '1990-01-02 00:00:00'
          })
        )
      })

      describe('expectedWorkingHours', () => {
        it('should work', async () => {
          const expectedWorkingHours = await resolvers.Project.expectedWorkingHours(
            project,
            {},
            { user },
            null as any
          )

          expect(expectedWorkingHours).toBe(35)
        })
      })

      describe('actualWorkingHours', () => {
        it('should work', async () => {
          const actualWorkingHours = await resolvers.Project.actualWorkingHours(
            project,
            {},
            { user },
            null as any
          )

          expect(actualWorkingHours).toBe(24)
        })
      })

      describe('budget', () => {
        it('should work', async () => {
          const budget = await resolvers.Project.budget(
            project,
            {},
            { user },
            null as any
          )
          expect(budget).toBe(600)
        })
      })

      describe('balance', () => {
        it('should work', async () => {
          const balance = await resolvers.Project.balance(
            project,
            {},
            { user },
            null as any
          )
          expect(balance).toBe(582.5)
        })
      })
    })
  })

  describe('User', () => {
    let user: User
    const since = '1990-01-01 04:30:00'

    beforeAll(async () => {
      const { lastID } = await insert('user', getFakeUser())

      user = userFromDatabase(
        definitely(
          await db.get<UserFromDatabase>(
            SQL`SELECT * FROM user WHERE id = ${lastID}`
          )
        )
      )
    })

    describe('empty state', () => {
      it('should work', async () => {
        const expectedWorkingHours = await resolvers.User.expectedWorkingHours(
          userToDatabase(user),
          { since },
          { user },
          null as any
        )

        const actualWorkingHours = await resolvers.User.actualWorkingHours(
          userToDatabase(user),
          { since },
          { user },
          null as any
        )

        const budget = await resolvers.User.budget(
          userToDatabase(user),
          { since },
          { user },
          null as any
        )
        const balance = await resolvers.User.balance(
          userToDatabase(user),
          { since },
          { user },
          null as any
        )

        expect(expectedWorkingHours).toBe(0)
        expect(actualWorkingHours).toBe(0)
        expect(budget).toBe(0)
        expect(balance).toBe(0)
      })
    })

    describe('with data', () => {
      beforeAll(async () => {
        const client1Id = definitely(
          (await insert('client', getFakeClient(user.id))).lastID
        )

        const client2Id = definitely(
          (await insert('client', getFakeClient(user.id))).lastID
        )

        const project1Id = definitely(
          (
            await insert(
              'project',
              getFakeProject(client1Id, {
                cashed_at: null
              })
            )
          ).lastID
        )

        const project2Id = definitely(
          (
            await insert(
              'project',
              getFakeProject(client2Id, {
                cashed_at: toSQLDate(new Date())
              })
            )
          ).lastID
        )

        const task1Id = definitely(
          (
            await insert(
              'task',
              getFakeTaskFromDatabase(project1Id, {
                expectedWorkingHours: 10,
                hourlyCost: 25,
                start_time: '1990-01-01 00:00:00'
              })
            )
          ).lastID
        )

        const task2Id = definitely(
          (
            await insert(
              'task',
              getFakeTaskFromDatabase(project1Id, {
                expectedWorkingHours: 5,
                hourlyCost: 30,
                start_time: '1990-01-01 06:30:00'
              })
            )
          ).lastID
        )

        const task3Id = definitely(
          (
            await insert(
              'task',
              getFakeTaskFromDatabase(project2Id, {
                expectedWorkingHours: 20,
                hourlyCost: 10,
                start_time: '1990-01-01 18:45:00'
              })
            )
          ).lastID
        )

        // 3 hours - not taken into consideration as "since" is before this
        await insert(
          'session',
          getFakeSessionFromDatabase(task1Id, {
            start_time: '1990-01-01 00:00:00',
            end_time: '1990-01-01 03:00:00'
          })
        )

        // 1.5 hours - not taken into consideration as "since" is before this
        await insert(
          'session',
          getFakeSessionFromDatabase(task1Id, {
            start_time: '1990-01-01 03:00:00',
            end_time: '1990-01-01 04:30:00'
          })
        )

        // 2 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task1Id, {
            start_time: '1990-01-01 04:30:00',
            end_time: '1990-01-01 06:30:00'
          })
        )

        // 6 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task2Id, {
            start_time: '1990-01-01 06:30:00',
            end_time: '1990-01-01 12:30:00'
          })
        )

        // 5 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task2Id, {
            start_time: '1990-01-01 12:30:00',
            end_time: '1990-01-01 17:30:00'
          })
        )

        // 1.25 hours
        await insert(
          'session',
          getFakeSessionFromDatabase(task2Id, {
            start_time: '1990-01-01 17:30:00',
            end_time: '1990-01-01 18:45:00'
          })
        )

        // 2 hours - not taken into consideration as project 2 is cashed
        await insert(
          'session',
          getFakeSessionFromDatabase(task3Id, {
            start_time: '1990-01-01 18:45:00',
            end_time: '1990-01-01 20:45:00'
          })
        )

        // 3 hours - not taken into consideration as project 2 is cashed
        await insert(
          'session',
          getFakeSessionFromDatabase(task3Id, {
            start_time: '1990-01-01 20:45:00',
            end_time: '1990-01-01 23:45:00'
          })
        )

        // 0.25 hours - not taken into consideration as project 2 is cashed
        await insert(
          'session',
          getFakeSessionFromDatabase(task3Id, {
            start_time: '1990-01-01 23:45:00',
            end_time: '1990-01-02 00:00:00'
          })
        )
      })

      describe('expectedWorkingHours', () => {
        it('should work', async () => {
          const expectedWorkingHours = await resolvers.User.expectedWorkingHours(
            userToDatabase(user),
            { since },
            { user },
            null as any
          )

          expect(expectedWorkingHours).toBe(5)
        })
      })

      describe('actualWorkingHours', () => {
        it('should work', async () => {
          const actualWorkingHours = await resolvers.User.actualWorkingHours(
            userToDatabase(user),
            { since },
            { user },
            null as any
          )

          expect(actualWorkingHours).toBe(14.25)
        })
      })

      describe('budget', () => {
        it('should work', async () => {
          const budget = await resolvers.User.budget(
            userToDatabase(user),
            { since },
            { user },
            null as any
          )
          expect(budget).toBe(150)
        })
      })

      describe('balance', () => {
        it('should work', async () => {
          const balance = await resolvers.User.balance(
            userToDatabase(user),
            { since },
            { user },
            null as any
          )
          expect(balance).toBe(417.5)
        })
      })
    })
  })
})
