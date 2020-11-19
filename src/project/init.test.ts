import SQL from 'sql-template-strings'
import { Client, ClientCreationInput } from '../client/interface'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeUser } from '../test/getFakeUser'
import { User } from '../user/interface'
import { init } from '../init'
import { pipe } from 'fp-ts/function'
import { registerUser } from '../test/registerUser'
import { option, taskEither } from 'fp-ts'
import { createClient } from '../client/model'
import { dbExec, dbGet, dbRun, insert, remove, update } from '../misc/dbUtils'
import { getFakeProject } from '../test/getFakeProject'
import {
  DatabaseProject,
  ProjectCreationInput,
  ProjectUpdateInput
} from './interface'
import { testError, testTaskEither } from '../test/util'
import { sleep } from '../test/sleep'
import { NonEmptyString } from 'io-ts-types'
import { NonNegativeNumber, PositiveInteger } from '../misc/Types'
import { TaskEither } from 'fp-ts/TaskEither'
import { ApolloError } from 'apollo-server-express'

describe('initProject', () => {
  describe('happy path', () => {
    let client: Client
    let user: User

    beforeAll(async () => {
      process.env.SECRET = 'shhhhh'
      await init()()
      await pipe(
        registerUser(getFakeUser()),
        taskEither.map(u => {
          user = u
          return u
        }),
        taskEither.chain(user => createClient(getFakeClient(user.id), user)),
        taskEither.map(c => {
          client = c
          return c
        })
      )()
    })

    afterAll(async () => {
      await remove('user')()
      delete process.env.SECRET
    })

    it('should create a database table', async () => {
      await dbExec(SQL`SELECT * FROM project`)()
    })

    it('should save the creation time automatically', async () => {
      await pipe(
        getFakeProject(client.id),
        project => insert('project', project, ProjectCreationInput),
        taskEither.chain(lastID => getProjectById(lastID)),
        testTaskEither(project => {
          expect(DatabaseProject.is(project)).toBe(true)
          expect(project.created_at).toBeInstanceOf(Date)
        })
      )
    })

    it('should keep track of the time of the last update', async () => {
      await pipe(
        insert('project', getFakeProject(client.id), ProjectCreationInput),
        taskEither.chain(lastID => getProjectById(lastID)),
        taskEither.chain(before =>
          pipe(
            sleep(1000, null),
            taskEither.fromTask,
            taskEither.chain(() =>
              update(
                'project',
                before.id,
                { name: 'Some weird name' as NonEmptyString },
                ProjectUpdateInput
              )
            ),
            taskEither.chain(() => getProjectById(before.id)),
            taskEither.map(after => ({ before, after }))
          )
        ),
        testTaskEither(({ before, after }) => {
          expect(before.updated_at.getTime()).not.toBe(
            after.updated_at.getTime()
          )
        })
      )
    })

    it("should delete all client's projects when the client is deleted", async () => {
      await pipe(
        registerUser(getFakeUser(), user),
        taskEither.chain(({ id: userId }) =>
          pipe(
            insert('client', getFakeClient(userId), ClientCreationInput),
            taskEither.chain(clientId =>
              insert('project', getFakeProject(clientId), ProjectCreationInput)
            ),
            taskEither.chain(projectId => getProjectById(projectId)),
            taskEither.chain(project =>
              pipe(
                remove('user', { id: userId }),
                taskEither.chain(() =>
                  dbGet(
                    SQL`SELECT * FROM project WHERE id = ${project.id}`,
                    DatabaseProject
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

    it('should set cashed_balance to null if cashed_at is set to null', async () => {
      const project = await pipe(
        insert(
          'project',
          getFakeProject(client.id, {
            cashed: option.some({
              at: new Date(Date.UTC(1990, 0, 1)),
              balance: 42 as NonNegativeNumber
            })
          }),
          ProjectCreationInput
        ),
        taskEither.chain(projectId => getProjectById(projectId)),
        testTaskEither(project => {
          expect(DatabaseProject.encode(project)).toMatchObject({
            cashed_at: '1990-01-01T00:00:00.000Z',
            cashed_balance: 42
          })

          return project
        })
      )

      await pipe(
        dbRun(
          SQL`UPDATE project SET cashed_at = NULL WHERE id = ${project.id}`
        ),
        taskEither.chain(() => getProjectById(project.id)),
        testTaskEither(project => {
          expect(option.isNone(project.cashed)).toBe(true)
          expect(DatabaseProject.encode(project)).toMatchObject({
            cashed_at: null,
            cashed_balance: null
          })
        })
      )
    })

    it('should set cashed_balance to zero if there are no sessions', async () => {
      const project = await pipe(
        insert(
          'project',
          getFakeProject(client.id, { cashed: option.none }),
          ProjectCreationInput
        ),
        taskEither.chain(projectId => getProjectById(projectId)),
        testTaskEither(project => {
          expect(DatabaseProject.encode(project)).toMatchObject({
            cashed_at: null,
            cashed_balance: null
          })

          return project
        })
      )

      await pipe(
        dbRun(
          SQL`UPDATE project SET cashed_at = '1990-01-01 00:00:00' WHERE id = ${project.id}`
        ),
        taskEither.chain(() => getProjectById(project.id)),
        testTaskEither(project => {
          expect(project.cashed).toEqual(
            option.some({
              at: new Date(1990, 0, 1),
              balance: 0
            })
          )

          expect(DatabaseProject.encode(project)).toMatchObject({
            cashed_at: new Date(1990, 0, 1).toISOString(),
            cashed_balance: 0
          })
        })
      )
    })
  })
})

function getProjectById(
  id: PositiveInteger
): TaskEither<ApolloError, DatabaseProject> {
  return pipe(
    dbGet(
      SQL`
        SELECT project.*, client.user FROM project
        JOIN client ON client.id = project.client
        WHERE project.id = ${id}
      `,
      DatabaseProject
    ),
    taskEither.chain(taskEither.fromOption(testError))
  )
}
