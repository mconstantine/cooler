import { init } from '../init'
import resolvers from './resolvers'
import { remove } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeTask } from '../test/getFakeTask'
import { User } from '../user/interface'
import { DatabaseProject } from '../project/interface'
import { constVoid, identity, pipe } from 'fp-ts/function'
import { option, taskEither } from 'fp-ts'
import { registerUser } from '../test/registerUser'
import { pipeTestTaskEither, testError, testTaskEither } from '../test/util'
import { insertClient } from '../client/database'
import { getProjectById, insertProject } from '../project/database'
import { DatabaseTask } from '../task/interface'
import { getTaskById, insertTask } from '../task/database'
import { NonNegativeNumber } from '../misc/Types'
import { sequenceS, sequenceT } from 'fp-ts/Apply'
import { insertSession } from './database'
import { getFakeSession } from '../test/getFakeSession'

describe('session resolvers', () => {
  let user: User
  let project: DatabaseProject

  beforeAll(async () => {
    process.env.SECRET = 'shhhhh'

    await pipe(
      init(),
      taskEither.chain(() => registerUser(getFakeUser())),
      pipeTestTaskEither(u => {
        user = u
      }),
      taskEither.chain(user => insertClient(getFakeClient(user.id))),
      taskEither.chain(clientId => insertProject(getFakeProject(clientId))),
      taskEither.chain(getProjectById),
      taskEither.chain(taskEither.fromOption(testError)),
      pipeTestTaskEither(p => {
        project = p
      }),
      testTaskEither(constVoid)
    )
  })

  afterAll(async () => {
    delete process.env.SECRET
    await pipe(remove('user'), testTaskEither(constVoid))
  })

  describe('Task', () => {
    let task: DatabaseTask

    beforeAll(async () => {
      await pipe(
        insertTask(
          getFakeTask(project.id, {
            expectedWorkingHours: 10 as NonNegativeNumber,
            hourlyCost: 50 as NonNegativeNumber
          })
        ),
        taskEither.chain(getTaskById),
        taskEither.chain(taskEither.fromOption(testError)),
        pipeTestTaskEither(t => {
          task = t
        }),
        testTaskEither(constVoid)
      )
    })

    afterAll(async () => {
      await pipe(
        remove('task', { project: project.id }),
        testTaskEither(constVoid)
      )
    })

    describe('empty state', () => {
      it('should work', async () => {
        const actualWorkingHours = await resolvers.Task.actualWorkingHours(
          task,
          {},
          { user }
        )

        const budget = await resolvers.Task.budget(task, {}, { user })
        const balance = await resolvers.Task.balance(task, {}, { user })

        expect(actualWorkingHours).toBe(0)
        expect(budget).toBe(500)
        expect(balance).toBe(0)
      })
    })

    describe('with sessions', () => {
      beforeAll(async () => {
        await pipe(
          sequenceT(taskEither.taskEither)(
            // 1 hour
            insertSession(
              getFakeSession(task.id, {
                start_time: new Date('1990-01-01T00:00:00.000Z'),
                end_time: option.some(new Date('1990-01-01T01:00:00.000Z'))
              })
            ),
            // 2 hours
            insertSession(
              getFakeSession(task.id, {
                start_time: new Date('1990-01-01T01:00:00.000Z'),
                end_time: option.some(new Date('1990-01-01T03:00:00.000Z'))
              })
            ),
            // 1.5 hours
            insertSession(
              getFakeSession(task.id, {
                start_time: new Date('1990-01-01T04:00:00.000Z'),
                end_time: option.some(new Date('1990-01-01T05:30:00.000Z'))
              })
            )
          ),
          testTaskEither(constVoid)
        )
      })

      describe('actualWorkingHours', () => {
        it('should work', async () => {
          const actualWorkingHours = await resolvers.Task.actualWorkingHours(
            task,
            {},
            { user }
          )
          expect(actualWorkingHours).toBe(4.5)
        })
      })

      describe('budget', () => {
        it('should work', async () => {
          const budget = await resolvers.Task.budget(task, {}, { user })
          expect(budget).toBe(500)
        })
      })

      describe('balance', () => {
        it('should work', async () => {
          const balance = await resolvers.Task.balance(task, {}, { user })
          expect(balance).toBe(225)
        })
      })
    })
  })

  describe('Project', () => {
    describe('empty state', () => {
      it('should work', async () => {
        const expectedWorkingHours = await resolvers.Project.expectedWorkingHours(
          project,
          {},
          { user }
        )

        const actualWorkingHours = await resolvers.Project.actualWorkingHours(
          project,
          {},
          { user }
        )

        const budget = await resolvers.Project.budget(project, {}, { user })
        const balance = await resolvers.Project.balance(project, {}, { user })

        expect(expectedWorkingHours).toBe(0)
        expect(actualWorkingHours).toBe(0)
        expect(budget).toBe(0)
        expect(balance).toBe(0)
      })
    })

    describe('with tasks', () => {
      beforeAll(async () => {
        const { task1Id, task2Id, task3Id } = await pipe(
          sequenceS(taskEither.taskEither)({
            task1Id: insertTask(
              getFakeTask(project.id, {
                expectedWorkingHours: 10 as NonNegativeNumber,
                hourlyCost: 25 as NonNegativeNumber
              })
            ),
            task2Id: insertTask(
              getFakeTask(project.id, {
                expectedWorkingHours: 5 as NonNegativeNumber,
                hourlyCost: 30 as NonNegativeNumber
              })
            ),
            task3Id: insertTask(
              getFakeTask(project.id, {
                expectedWorkingHours: 20 as NonNegativeNumber,
                hourlyCost: 10 as NonNegativeNumber
              })
            )
          }),
          testTaskEither(identity)
        )

        await pipe(
          sequenceT(taskEither.taskEither)(
            // 3 hours
            insertSession(
              getFakeSession(task1Id, {
                start_time: new Date('1990-01-01T00:00:00Z'),
                end_time: option.some(new Date('1990-01-01T03:00:00Z'))
              })
            ),
            // 1.5 hours
            insertSession(
              getFakeSession(task1Id, {
                start_time: new Date('1990-01-01T03:00:00Z'),
                end_time: option.some(new Date('1990-01-01T04:30:00Z'))
              })
            ),
            // 2 hours
            insertSession(
              getFakeSession(task1Id, {
                start_time: new Date('1990-01-01T04:30:00Z'),
                end_time: option.some(new Date('1990-01-01T06:30:00Z'))
              })
            ),
            // 6 hours
            insertSession(
              getFakeSession(task2Id, {
                start_time: new Date('1990-01-01T06:30:00Z'),
                end_time: option.some(new Date('1990-01-01T12:30:00Z'))
              })
            ),
            // 5 hours
            insertSession(
              getFakeSession(task2Id, {
                start_time: new Date('1990-01-01T12:30:00Z'),
                end_time: option.some(new Date('1990-01-01T17:30:00Z'))
              })
            ),
            // 1.25 hours
            insertSession(
              getFakeSession(task2Id, {
                start_time: new Date('1990-01-01T17:30:00Z'),
                end_time: option.some(new Date('1990-01-01T18:45:00Z'))
              })
            ),
            // 2 hours
            insertSession(
              getFakeSession(task3Id, {
                start_time: new Date('1990-01-01T18:45:00Z'),
                end_time: option.some(new Date('1990-01-01T20:45:00Z'))
              })
            ),
            // 3 hours
            insertSession(
              getFakeSession(task3Id, {
                start_time: new Date('1990-01-01T20:45:00Z'),
                end_time: option.some(new Date('1990-01-01T23:45:00Z'))
              })
            ),
            // 0.25 hours
            insertSession(
              getFakeSession(task3Id, {
                start_time: new Date('1990-01-01T23:45:00Z'),
                end_time: option.some(new Date('1990-01-02T00:00:00Z'))
              })
            )
          ),
          testTaskEither(constVoid)
        )
      })

      describe('expectedWorkingHours', () => {
        it('should work', async () => {
          const expectedWorkingHours = await resolvers.Project.expectedWorkingHours(
            project,
            {},
            { user }
          )
          expect(expectedWorkingHours).toBe(35)
        })
      })

      describe('actualWorkingHours', () => {
        it('should work', async () => {
          const actualWorkingHours = await resolvers.Project.actualWorkingHours(
            project,
            {},
            { user }
          )
          expect(actualWorkingHours).toBe(24)
        })
      })

      describe('budget', () => {
        it('should work', async () => {
          const budget = await resolvers.Project.budget(project, {}, { user })
          expect(budget).toBe(600)
        })
      })

      describe('balance', () => {
        it('should work', async () => {
          const balance = await resolvers.Project.balance(project, {}, { user })
          expect(balance).toBe(582.5)
        })
      })
    })
  })

  describe('User', () => {
    let user2: User
    const since = '1990-01-01T04:30:00.000Z'

    beforeAll(async () => {
      await pipe(
        registerUser(getFakeUser(), user),
        pipeTestTaskEither(u => {
          user2 = u
        }),
        testTaskEither(constVoid)
      )
    })

    describe('empty state', () => {
      it('should work', async () => {
        const expectedWorkingHours = await resolvers.User.expectedWorkingHours(
          user2,
          { since },
          { user: user2 }
        )

        const actualWorkingHours = await resolvers.User.actualWorkingHours(
          user2,
          { since },
          { user: user2 }
        )

        const budget = await resolvers.User.budget(
          user2,
          { since },
          { user: user2 }
        )

        const balance = await resolvers.User.balance(
          user2,
          { since },
          { user: user2 }
        )

        expect(expectedWorkingHours).toBe(0)
        expect(actualWorkingHours).toBe(0)
        expect(budget).toBe(0)
        expect(balance).toBe(0)
      })
    })

    describe('with data', () => {
      beforeAll(async () => {
        const { client1Id, client2Id } = await pipe(
          sequenceS(taskEither.taskEither)({
            client1Id: insertClient(getFakeClient(user2.id)),
            client2Id: insertClient(getFakeClient(user2.id))
          }),
          testTaskEither(identity)
        )

        const { project1Id, project2Id } = await pipe(
          sequenceS(taskEither.taskEither)({
            project1Id: insertProject(
              getFakeProject(client1Id, {
                cashed: option.none
              })
            ),
            project2Id: insertProject(
              getFakeProject(client2Id, {
                cashed: option.some({
                  at: new Date(),
                  balance: 42 as NonNegativeNumber
                })
              })
            )
          }),
          testTaskEither(identity)
        )

        const { task1Id, task2Id, task3Id } = await pipe(
          sequenceS(taskEither.taskEither)({
            task1Id: insertTask(
              getFakeTask(project1Id, {
                expectedWorkingHours: 10 as NonNegativeNumber,
                hourlyCost: 25 as NonNegativeNumber,
                start_time: new Date('1990-01-01T00:00:00.000Z')
              })
            ),
            task2Id: insertTask(
              getFakeTask(project1Id, {
                expectedWorkingHours: 5 as NonNegativeNumber,
                hourlyCost: 30 as NonNegativeNumber,
                start_time: new Date('1990-01-01T06:30:00.000Z')
              })
            ),
            task3Id: insertTask(
              getFakeTask(project2Id, {
                expectedWorkingHours: 20 as NonNegativeNumber,
                hourlyCost: 10 as NonNegativeNumber,
                start_time: new Date('1990-01-01T18:45:00.000Z')
              })
            )
          }),
          testTaskEither(identity)
        )

        await pipe(
          sequenceT(taskEither.taskEither)(
            // 3 hours - not taken into consideration as "since" is before this
            insertSession(
              getFakeSession(task1Id, {
                start_time: new Date('1990-01-01T00:00:00.000Z'),
                end_time: option.some(new Date('1990-01-01T03:00:00.000Z'))
              })
            ),
            // 1.5 hours - not taken into consideration as "since" is before this
            insertSession(
              getFakeSession(task1Id, {
                start_time: new Date('1990-01-01T03:00:00.000Z'),
                end_time: option.some(new Date('1990-01-01T04:30:00.000Z'))
              })
            ),
            // 2 hours
            insertSession(
              getFakeSession(task1Id, {
                start_time: new Date('1990-01-01T04:30:00.000Z'),
                end_time: option.some(new Date('1990-01-01T06:30:00.000Z'))
              })
            ),
            // 6 hours
            insertSession(
              getFakeSession(task2Id, {
                start_time: new Date('1990-01-01T06:30:00.000Z'),
                end_time: option.some(new Date('1990-01-01T12:30:00.000Z'))
              })
            ),
            // 5 hours
            insertSession(
              getFakeSession(task2Id, {
                start_time: new Date('1990-01-01T12:30:00.000Z'),
                end_time: option.some(new Date('1990-01-01T17:30:00.000Z'))
              })
            ),
            // 1.25 hours
            insertSession(
              getFakeSession(task2Id, {
                start_time: new Date('1990-01-01T17:30:00.000Z'),
                end_time: option.some(new Date('1990-01-01T18:45:00.000Z'))
              })
            ),
            // 2 hours - not taken into consideration as project 2 is cashed
            insertSession(
              getFakeSession(task3Id, {
                start_time: new Date('1990-01-01T18:45:00.000Z'),
                end_time: option.some(new Date('1990-01-01T20:45:00.000Z'))
              })
            ),
            // 3 hours - not taken into consideration as project 2 is cashed
            insertSession(
              getFakeSession(task3Id, {
                start_time: new Date('1990-01-01T20:45:00.000Z'),
                end_time: option.some(new Date('1990-01-01T23:45:00.000Z'))
              })
            ),
            // 0.25 hours - not taken into consideration as project 2 is cashed
            insertSession(
              getFakeSession(task3Id, {
                start_time: new Date('1990-01-01T23:45:00.000Z'),
                end_time: option.some(new Date('1990-01-02T00:00:00.000Z'))
              })
            )
          ),
          testTaskEither(constVoid)
        )
      })

      describe('expectedWorkingHours', () => {
        it('should work', async () => {
          const expectedWorkingHours = await resolvers.User.expectedWorkingHours(
            user2,
            { since },
            { user: user2 }
          )
          expect(expectedWorkingHours).toBe(5)
        })
      })

      describe('actualWorkingHours', () => {
        it('should work', async () => {
          const actualWorkingHours = await resolvers.User.actualWorkingHours(
            user2,
            { since },
            { user: user2 }
          )
          expect(actualWorkingHours).toBe(14.25)
        })
      })

      describe('budget', () => {
        it('should work', async () => {
          const budget = await resolvers.User.budget(
            user2,
            { since },
            { user: user2 }
          )
          expect(budget).toBe(150)
        })
      })

      describe('balance', () => {
        it('should work', async () => {
          const balance = await resolvers.User.balance(
            user2,
            { since },
            { user: user2 }
          )
          expect(balance).toBe(417.5)
        })
      })
    })
  })
})
