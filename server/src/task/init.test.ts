import { init } from '../init'
import { dbExec, dbGet, insert, remove, update } from '../misc/dbUtils'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeUser } from '../test/getFakeUser'
import { Project, ProjectCreationInput } from '../project/interface'
import { constVoid, pipe } from 'fp-ts/function'
import { testError, testTaskEither } from '../test/util'
import { Client } from '../client/interface'
import { registerUser } from '../test/registerUser'
import { option, taskEither } from 'fp-ts'
import { getClientById, insertClient } from '../client/database'
import { getProjectById, insertProject } from '../project/database'
import SQL from 'sql-template-strings'
import { getFakeTask } from '../test/getFakeTask'
import {
  DatabaseTask,
  Task,
  TaskCreationInput,
  TaskUpdateInput
} from './interface'
import { UnknownRecord } from 'io-ts'
import { sleep } from '../test/sleep'
import { NonEmptyString } from 'io-ts-types'
import { User } from '../user/interface'
import { PositiveInteger, unsafeNonEmptyString } from '../misc/Types'

describe('initTask', () => {
  let user: User
  let project: Project

  beforeAll(async () => {
    process.env.SECRET = 'shhhhh'
    await pipe(init(), testTaskEither(constVoid))
  })

  afterAll(async () => {
    delete process.env.SECRET
    await pipe(remove('user'), testTaskEither(constVoid))
  })

  describe('happy path', () => {
    let client: Client

    beforeAll(async () => {
      await pipe(
        registerUser(getFakeUser()),
        taskEither.chain(u => {
          user = u
          return insertClient(getFakeClient(u.id))
        }),
        taskEither.chain(getClientById),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(c => {
          client = c
          return insertProject(getFakeProject(client.id))
        }),
        taskEither.chain(getProjectById),
        taskEither.chain(taskEither.fromOption(testError)),
        testTaskEither(p => {
          project = p
        })
      )
    })

    it('should create a database table', async () => {
      await pipe(dbExec(SQL`SELECT * FROM task`), testTaskEither(constVoid))
    })

    it('should save dates in SQL format', async () => {
      await pipe(
        insert('task', getFakeTask(project.id), TaskCreationInput),
        taskEither.chain(id =>
          dbGet(SQL`SELECT * FROM task WHERE id = ${id}`, UnknownRecord)
        ),
        taskEither.chain(taskEither.fromOption(testError)),
        testTaskEither(task => {
          const sqlDatePattern = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/

          expect(task.start_time).toMatch(sqlDatePattern)
          expect(task.created_at).toMatch(sqlDatePattern)
          expect(task.updated_at).toMatch(sqlDatePattern)
        })
      )
    })

    it('should save the creation time automatically', async () => {
      await pipe(
        insert('task', getFakeTask(project.id), TaskCreationInput),
        taskEither.chain(id =>
          dbGet(
            SQL`
              SELECT task.*, client.user
              FROM task
              JOIN project ON task.project = project.id
              JOIN client ON project.client = client.id
              WHERE task.id = ${id}
            `,
            DatabaseTask
          )
        ),
        taskEither.chain(taskEither.fromOption(testError)),
        testTaskEither(task => {
          expect(Task.is(task)).toBe(true)
          expect(task.created_at).toBeInstanceOf(Date)
        })
      )
    })

    it('should keep track of the time of the last update', async () => {
      const updateData = { name: unsafeNonEmptyString('Some weird name') }

      await pipe(
        insert('task', getFakeTask(project.id), TaskCreationInput),
        taskEither.chain(id =>
          dbGet(
            SQL`
              SELECT task.*, client.user
              FROM task
              JOIN project ON task.project = project.id
              JOIN client ON project.client = client.id
              WHERE task.id = ${id}
            `,
            DatabaseTask
          )
        ),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(task => taskEither.fromTask(sleep(1000, task))),
        taskEither.chain(task =>
          pipe(
            update('task', task.id, updateData, TaskUpdateInput),
            taskEither.chain(() =>
              dbGet(
                SQL`
                  SELECT task.*, client.user
                  FROM task
                  JOIN project ON task.project = project.id
                  JOIN client ON project.client = client.id
                  WHERE task.id = ${task.id}
                `,
                DatabaseTask
              )
            ),
            taskEither.chain(taskEither.fromOption(testError)),
            taskEither.map(({ updated_at }) => ({
              before: task.updated_at,
              after: updated_at
            }))
          )
        ),
        testTaskEither(({ before, after }) => {
          expect(before.getTime()).not.toBe(after.getTime())
        })
      )
    })

    it("should delete all project's tasks when a project is deleted", async () => {
      await pipe(
        insert('project', getFakeProject(client.id), ProjectCreationInput),
        taskEither.chain(projectId =>
          pipe(
            insert('task', getFakeTask(projectId), TaskCreationInput),
            taskEither.chain(taskId =>
              pipe(
                remove('project', { id: projectId }),
                taskEither.chain(() =>
                  dbGet(
                    SQL`
                      SELECT task.*, client.user
                      FROM task
                      JOIN project ON task.project = project.id
                      JOIN client ON project.client = client.id
                      WHERE task.id = ${taskId}
                    `,
                    DatabaseTask
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
    it('should make user deletion bubble down to tasks', async () => {
      let userId: PositiveInteger
      let taskId: PositiveInteger

      await pipe(
        registerUser(getFakeUser(), user),
        taskEither.chain(user => {
          userId = user.id
          return insertClient(getFakeClient(user.id))
        }),
        taskEither.chain(clientId => insertProject(getFakeProject(clientId))),
        taskEither.chain(projectId =>
          insert('task', getFakeTask(projectId), TaskCreationInput)
        ),
        taskEither.chain(id => {
          taskId = id
          return remove('user', { id: userId })
        }),
        taskEither.chain(() =>
          dbGet(SQL`SELECT * FROM task WHERE id = ${taskId}`, DatabaseTask)
        ),
        testTaskEither(result => {
          expect(option.isNone(result)).toBe(true)
        })
      )
    })
  })

  describe('project update', () => {
    it('should update the project when a task is created for it', async () => {
      await pipe(
        getProjectById(project.id),
        taskEither.chain(taskEither.fromOption(testError)),
        taskEither.chain(project => taskEither.fromTask(sleep(1000, project))),
        taskEither.chain(project =>
          pipe(
            insert('task', getFakeTask(project.id), TaskCreationInput),
            taskEither.chain(() => getProjectById(project.id)),
            taskEither.chain(taskEither.fromOption(testError)),
            taskEither.map(({ updated_at }) => ({
              before: project.updated_at,
              after: updated_at
            }))
          )
        ),
        testTaskEither(({ before, after }) => {
          expect(before.getTime()).not.toBe(after.getTime())
        })
      )
    })
  })
})
