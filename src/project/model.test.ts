import { User } from '../user/interface'
import { Client } from '../client/interface'
import { Project } from './interface'
import { init } from '../init'
import { constVoid, pipe } from 'fp-ts/function'
import { testError, testTaskEither, testTaskEitherError } from '../test/util'
import { registerUser } from '../test/registerUser'
import { getFakeUser } from '../test/getFakeUser'
import { sequenceS } from 'fp-ts/lib/Apply'
import { option, taskEither } from 'fp-ts'
import { getFakeClient } from '../test/getFakeClient'
import { getClientById, insertClient } from '../client/database'
import { getProjectById, insertProject } from './database'
import { getFakeProject } from '../test/getFakeProject'
import { deleteUser } from '../user/database'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from './model'
import { getConnectionNodes } from '../test/getConnectionNodes'

let user1: User
let user2: User
let client1: Client
let client2: Client
let project1: Project
let project2: Project

beforeAll(async () => {
  process.env.SECRET = 'shhhhh'
  await pipe(init(), testTaskEither(constVoid))

  await pipe(
    registerUser(getFakeUser()),
    testTaskEither(user => {
      user1 = user
    })
  )

  await pipe(
    registerUser(getFakeUser(), user1),
    testTaskEither(user => {
      user2 = user
    })
  )

  await pipe(
    sequenceS(taskEither.taskEither)({
      c1: pipe(
        insertClient(getFakeClient(user1.id)),
        taskEither.chain(id => getClientById(id))
      ),
      c2: pipe(
        insertClient(getFakeClient(user2.id)),
        taskEither.chain(id => getClientById(id))
      )
    }),
    taskEither.map(({ c1, c2 }) => sequenceS(option.option)({ c1, c2 })),
    taskEither.chain(taskEither.fromOption(testError)),
    testTaskEither(({ c1, c2 }) => {
      client1 = c1
      client2 = c2
    })
  )

  await pipe(
    sequenceS(taskEither.taskEither)({
      p1: pipe(
        insertProject(getFakeProject(client1.id)),
        taskEither.chain(id => getProjectById(id))
      ),
      p2: pipe(
        insertProject(getFakeProject(client2.id)),
        taskEither.chain(id => getProjectById(id))
      )
    }),
    taskEither.map(({ p1, p2 }) => sequenceS(option.option)({ p1, p2 })),
    taskEither.chain(taskEither.fromOption(testError)),
    testTaskEither(({ p1, p2 }) => {
      project1 = p1
      project2 = p2
    })
  )
})

afterAll(async () => {
  delete process.env.SECRET

  await pipe(
    deleteUser(user1.id),
    taskEither.chain(() => deleteUser(user2.id)),
    testTaskEither(constVoid)
  )
})

describe('createProject', () => {
  it('should work', async () => {
    await pipe(
      createProject(getFakeProject(client1.id), user1),
      testTaskEither(project => {
        expect(Project.is(project)).toBe(true)
      })
    )
  })

  it("should not allow users to create projects for other users' clients", async () => {
    await pipe(
      createProject(getFakeProject(client2.id), user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})

describe('getProject', () => {
  it('should work', async () => {
    await pipe(
      getProject(project1.id, user1),
      testTaskEither(project => {
        expect(Project.is(project)).toBe(true)
        expect(project).toMatchObject(project1)
      })
    )
  })

  it("should not allow users to see other users' projects", async () => {
    await pipe(
      getProject(project2.id, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})

describe('listProjects', () => {
  it("should list only the user's projects", async () => {
    await pipe(
      listProjects({ name: option.none }, user1),
      testTaskEither(connection => {
        const projects = getConnectionNodes(connection)

        expect(projects).toContainEqual(
          expect.objectContaining({ id: project1.id })
        )

        expect(projects).not.toContainEqual(
          expect.objectContaining({ id: project2.id })
        )
      })
    )
  })
})

describe('updateProject', () => {
  it('should work', async () => {
    const data = getFakeProject(client1.id)

    await pipe(
      updateProject(project1.id, data, user1),
      testTaskEither(project => {
        expect(Project.is(project)).toBe(true)
        expect(project).toMatchObject(data)
        project1 = project
      })
    )
  })

  it("should not allow users to update other users' projects", async () => {
    await pipe(
      updateProject(project1.id, getFakeProject(client1.id), user2),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })

  it("should not allow users to assign to their projects other users' clients", async () => {
    await pipe(
      updateProject(project1.id, getFakeProject(client2.id), user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})

describe('deleteProject', () => {
  let project1: Project
  let project2: Project

  beforeAll(async () => {
    await pipe(
      sequenceS(taskEither.taskEither)({
        p1: createProject(getFakeProject(client1.id), user1),
        p2: createProject(getFakeProject(client2.id), user2)
      }),
      testTaskEither(({ p1, p2 }) => {
        project1 = p1
        project2 = p2
      })
    )
  })

  it('should work', async () => {
    await pipe(
      deleteProject(project1.id, user1),
      testTaskEither(project => {
        expect(project).toMatchObject(project1)
      })
    )
  })

  it("should not allow users to delete other users' projects", async () => {
    await pipe(
      deleteProject(project2.id, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})
