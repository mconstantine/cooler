import { option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { UnknownRecord } from 'io-ts'
import SQL from 'sql-template-strings'
import { insertClient } from '../client/database'
import { init } from '../init'
import { dbExec, dbGet, insert, remove } from '../misc/dbUtils'
import { PositiveInteger } from '../misc/Types'
import { getProjectById, insertProject } from '../project/database'
import { Project } from '../project/interface'
import { deleteTask, getTaskById, insertTask } from '../task/database'
import { Task } from '../task/interface'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeSession } from '../test/getFakeSession'
import { getFakeTask } from '../test/getFakeTask'
import { getFakeUser } from '../test/getFakeUser'
import { registerUser } from '../test/registerUser'
import { sleep } from '../test/sleep'
import { testError, testTaskEither } from '../test/util'
import { User } from '../user/interface'
import { SessionCreationInput } from './interface'

describe('init', () => {
  let user: User
  let client: PositiveInteger
  let project: PositiveInteger

  beforeAll(async () => {
    process.env.SECRET = 'shhhhh'
    await pipe(init(), testTaskEither(constVoid))

    await pipe(
      registerUser(getFakeUser()),
      testTaskEither(u => {
        user = u
      })
    )

    await pipe(
      insertClient(getFakeClient(user.id)),
      testTaskEither(c => {
        client = c
      })
    )

    await pipe(
      insertProject(getFakeProject(client)),
      testTaskEither(p => {
        project = p
      })
    )
  })

  afterAll(async () => {
    delete process.env.SECRET
    await pipe(remove('user'), testTaskEither(constVoid))
  })

  describe('happy path', () => {
    it('should create a database table', async () => {
      await pipe(dbExec(SQL`SELECT * FROM session`), testTaskEither(constVoid))
    })

    it("should delete all task's sessions when a task is deleted", async () => {
      await pipe(
        insertTask(getFakeTask(project)),
        taskEither.chain(taskId =>
          pipe(
            insert('session', getFakeSession(taskId), SessionCreationInput),
            taskEither.chain(sessionId =>
              pipe(
                deleteTask(taskId),
                taskEither.chain(() =>
                  dbGet(
                    SQL`SELECT * FROM session WHERE id = ${sessionId}`,
                    UnknownRecord
                  )
                )
              )
            )
          )
        ),
        testTaskEither(result => {
          expect(option.isNone(result)).toBe(true)
        })
      )
    })
  })

  describe('deletion chain', () => {
    it('should make user deletion bubble down to sessions', async () => {
      let userId: PositiveInteger
      let sessionId: PositiveInteger

      await pipe(
        registerUser(getFakeUser(), user),
        testTaskEither(user => {
          userId = user.id
        })
      )

      await pipe(
        // @ts-ignore
        insertClient(getFakeClient(userId)),
        taskEither.chain(clientId => insertProject(getFakeProject(clientId))),
        taskEither.chain(projectId => insertTask(getFakeTask(projectId))),
        taskEither.chain(taskId =>
          insert('session', getFakeSession(taskId), SessionCreationInput)
        ),
        testTaskEither(id => {
          sessionId = id
        })
      )

      await pipe(
        // @ts-ignore
        remove('user', { id: userId }),
        taskEither.chain(() =>
          dbGet(
            SQL`SELECT * FROM session WHERE id = ${sessionId}`,
            UnknownRecord
          )
        ),
        testTaskEither(session => {
          expect(option.isNone(session)).toBe(true)
        })
      )
    })
  })

  describe('update chain', () => {
    it('should update the task and project when a session is created for them', async () => {
      let project: Project
      let task: Task

      await pipe(
        registerUser(getFakeUser(), user),
        taskEither.chain(user => insertClient(getFakeClient(user.id))),
        taskEither.chain(clientId => insertProject(getFakeProject(clientId))),
        taskEither.chain(id => getProjectById(id)),
        taskEither.chain(taskEither.fromOption(testError)),
        testTaskEither(p => {
          project = p
        })
      )

      await pipe(
        // @ts-ignore
        insertTask(getFakeTask(project.id)),
        taskEither.chain(id => getTaskById(id)),
        taskEither.chain(taskEither.fromOption(testError)),
        testTaskEither(t => {
          task = t
        })
      )

      // @ts-ignore
      const projectUpdatedAtBefore = project.updated_at
      // @ts-ignore
      const taskUpdatedAtBefore = task.updated_at

      await pipe(
        sleep(1000, null),
        taskEither.fromTask,
        taskEither.chain(() =>
          insert('session', getFakeSession(task.id), SessionCreationInput)
        ),
        taskEither.chain(() =>
          sequenceS(taskEither.taskEither)({
            projectUpdatedAtAfter: pipe(
              // @ts-ignore
              getProjectById(project.id),
              taskEither.chain(taskEither.fromOption(testError)),
              taskEither.map(({ updated_at }) => updated_at)
            ),
            taskUpdatedAtAfter: pipe(
              // @ts-ignore
              getTaskById(task.id),
              taskEither.chain(taskEither.fromOption(testError)),
              taskEither.map(({ updated_at }) => updated_at)
            )
          })
        ),
        testTaskEither(({ projectUpdatedAtAfter, taskUpdatedAtAfter }) => {
          expect(projectUpdatedAtBefore).not.toBe(projectUpdatedAtAfter)
          expect(taskUpdatedAtBefore).not.toBe(taskUpdatedAtAfter)
        })
      )
    })
  })
})
