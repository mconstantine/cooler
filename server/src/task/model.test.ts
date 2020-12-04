import { option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { DatabaseProject } from '../project/interface'
import { getFakeUser } from '../test/getFakeUser'
import { registerUser } from '../test/registerUser'
import { testError, testTaskEither, testTaskEitherError } from '../test/util'
import { User } from '../user/interface'
import { init } from '../init'
import { DatabaseTask, Task } from './interface'
import { dbGetAll, remove } from '../misc/dbUtils'
import { getClientById, insertClient } from '../client/database'
import { getFakeClient } from '../test/getFakeClient'
import { Client } from '../client/interface'
import { getProjectById, insertProject } from '../project/database'
import { getFakeProject } from '../test/getFakeProject'
import { getTaskById, insertTask } from './database'
import { getFakeTask } from '../test/getFakeTask'
import {
  createTask,
  createTasksBatch,
  getUserTasks,
  getTask,
  listTasks,
  updateTask,
  deleteTask
} from './model'
import {
  NonNegativeInteger,
  NonNegativeNumber,
  PositiveInteger
} from '../misc/Types'
import { NonEmptyString } from 'io-ts-types'
import SQL from 'sql-template-strings'
import { getConnectionNodes } from '../test/getConnectionNodes'

let user1: User
let user2: User
let client1: Client
let client2: Client
let project1: DatabaseProject
let project2: DatabaseProject
let task1: Task
let task2: Task

beforeAll(async () => {
  process.env.SECRET = 'shhhhh'

  await pipe(
    init(),
    taskEither.chain(() => registerUser(getFakeUser())),
    testTaskEither(u => {
      user1 = u
    })
  )

  await pipe(
    registerUser(getFakeUser(), user1),
    testTaskEither(u => {
      user2 = u
    })
  )

  await pipe(
    sequenceS(taskEither.taskEither)({
      c1: pipe(
        insertClient(getFakeClient(user1.id)),
        taskEither.chain(id => getClientById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      ),
      c2: pipe(
        insertClient(getFakeClient(user2.id)),
        taskEither.chain(id => getClientById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      )
    }),
    testTaskEither(({ c1, c2 }) => {
      client1 = c1
      client2 = c2
    })
  )

  await pipe(
    sequenceS(taskEither.taskEither)({
      p1: pipe(
        insertProject(getFakeProject(client1.id)),
        taskEither.chain(id => getProjectById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      ),
      p2: pipe(
        insertProject(getFakeProject(client2.id)),
        taskEither.chain(id => getProjectById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      )
    }),
    testTaskEither(({ p1, p2 }) => {
      project1 = p1
      project2 = p2
    })
  )

  await pipe(
    sequenceS(taskEither.taskEither)({
      t1: pipe(
        insertTask(getFakeTask(project1.id)),
        taskEither.chain(id => getTaskById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      ),
      t2: pipe(
        insertTask(getFakeTask(project2.id)),
        taskEither.chain(id => getTaskById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      )
    }),
    testTaskEither(({ t1, t2 }) => {
      task1 = t1
      task2 = t2
    })
  )
})

afterAll(async () => {
  delete process.env.SECRET
  await pipe(remove('user'), testTaskEither(constVoid))
})

describe('getTodayTasks', () => {
  let task1: Task
  let task2: Task

  beforeAll(async () => {
    await pipe(
      sequenceS(taskEither.taskEither)({
        t1: pipe(
          insertTask(getFakeTask(project1.id, { start_time: new Date() })),
          taskEither.chain(id => getTaskById(id)),
          taskEither.chain(taskEither.fromOption(testError))
        ),
        t2: pipe(
          insertTask(
            getFakeTask(project1.id, {
              start_time: new Date(Date.now() + 86400000)
            })
          ),
          taskEither.chain(id => getTaskById(id)),
          taskEither.chain(taskEither.fromOption(testError))
        )
      }),
      testTaskEither(({ t1, t2 }) => {
        task1 = t1
        task2 = t2
      })
    )
  })

  afterAll(async () => {
    await pipe(
      sequenceS(taskEither.taskEither)({
        task1: remove('task', { id: task1.id }),
        task2: remove('task', { id: task2.id })
      }),
      testTaskEither(constVoid)
    )
  })

  it('should work', async () => {
    const now = new Date()

    await pipe(
      getUserTasks(user1, {
        from: option.some(
          new Date(now.getFullYear(), now.getMonth(), now.getDate())
        ),
        to: option.some(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        )
      }),
      testTaskEither(connection => {
        const tasks = getConnectionNodes(connection)

        expect(tasks).toContainEqual(
          expect.objectContaining({
            id: task1.id
          })
        )
        expect(tasks).not.toContainEqual(
          expect.objectContaining({
            id: task2.id
          })
        )
      })
    )
  })
})

describe('createTask', () => {
  it('should work', async () => {
    await pipe(
      createTask(getFakeTask(project1.id), user1),
      testTaskEither(task => {
        expect(Task.is(task)).toBe(true)
      })
    )
  })

  it("should not allow users to create tasks for other users' projects", async () => {
    await pipe(
      createTask(getFakeTask(project2.id), user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})

describe('createTasksBatch', () => {
  let project: PositiveInteger

  beforeAll(async () => {
    await pipe(
      insertProject(getFakeProject(client1.id)),
      testTaskEither(id => {
        project = id
      })
    )
  })

  afterEach(async () => {
    await pipe(remove('task', { project }), testTaskEither(constVoid))
  })

  afterAll(async () => {
    await pipe(remove('project', { id: project }), testTaskEither(constVoid))
  })

  it('should copy expected working hours, hourly cost and start time', async () => {
    await pipe(
      createTasksBatch(
        {
          name: 'Task #' as NonEmptyString,
          expectedWorkingHours: 8 as NonNegativeNumber,
          hourlyCost: 1 as NonNegativeNumber,
          project,
          start_time: new Date(1990, 0, 1, 10, 42),
          from: new Date(1990, 0, 1, 10, 0),
          to: new Date(1990, 0, 5, 10, 0),
          repeat: 0x1111111 as NonNegativeInteger
        },
        user1
      ),
      taskEither.chain(() =>
        dbGetAll(
          SQL`
            SELECT task.*, client.user
            FROM task
            JOIN project ON task.project = project.id
            JOIN client ON project.client = client.id
            WHERE task.project = ${project}
          `,
          DatabaseTask
        )
      ),
      testTaskEither(tasks => {
        expect(tasks.length).toBe(5)

        tasks.forEach(task => {
          expect(task.expectedWorkingHours).toBe(8)
          expect(task.hourlyCost).toBe(1)
          expect(task.start_time.getHours()).toBe(10)
          expect(task.start_time.getMinutes()).toBe(42)
        })
      })
    )
  })

  it('should format dates correctly', async () => {
    await pipe(
      createTasksBatch(
        {
          name: 'D-DD-DDD-DDDD, M/MM/MMM/MMMM, YY / YYYY ADAMY' as NonEmptyString,
          start_time: new Date(1990, 0, 1, 10, 42),
          from: new Date(1990, 0, 1, 10, 0),
          to: new Date(1990, 0, 1, 10, 0),
          expectedWorkingHours: 8 as NonNegativeNumber,
          hourlyCost: 1 as NonNegativeNumber,
          project,
          repeat: 0x1111111 as NonNegativeInteger
        },
        user1
      ),
      taskEither.chain(() =>
        dbGetAll(
          SQL`
            SELECT task.*, client.user
            FROM task
            JOIN project ON task.project = project.id
            JOIN client ON project.client = client.id
            WHERE task.project = ${project}
          `,
          DatabaseTask
        )
      ),
      testTaskEither(tasks => {
        expect(tasks.length).toBe(1)
        expect(tasks[0].name).toBe(
          '1-01-Mon-Monday, 1/01/Jan/January, 90 / 1990 ADAMY'
        )
      })
    )
  })

  it('should format indexes correctly', async () => {
    await pipe(
      createTasksBatch(
        {
          name: 'Task #' as NonEmptyString,
          start_time: new Date(1990, 0, 1, 10, 42),
          from: new Date(1990, 0, 1, 10, 0),
          to: new Date(1990, 0, 5, 10, 0),
          expectedWorkingHours: 8 as NonNegativeNumber,
          hourlyCost: 1 as NonNegativeNumber,
          project,
          repeat: 0x1111111 as NonNegativeInteger
        },
        user1
      ),
      taskEither.chain(() =>
        dbGetAll(
          SQL`
            SELECT task.*, client.user
            FROM task
            JOIN project ON task.project = project.id
            JOIN client ON project.client = client.id
            WHERE task.project = ${project}
          `,
          DatabaseTask
        )
      ),
      testTaskEither(tasks => {
        expect(tasks.length).toBe(5)
        expect(tasks[0].name).toBe('Task 1')
        expect(tasks[1].name).toBe('Task 2')
        expect(tasks[2].name).toBe('Task 3')
        expect(tasks[3].name).toBe('Task 4')
        expect(tasks[4].name).toBe('Task 5')
      })
    )
  })

  it('should understand repeat with bit masks', async () => {
    await pipe(
      createTasksBatch(
        {
          name: 'Task #' as NonEmptyString,
          start_time: new Date(1990, 0, 1, 10, 42),
          from: new Date(1990, 0, 1, 10, 0),
          to: new Date(1990, 0, 7, 10, 0),
          expectedWorkingHours: 8 as NonNegativeNumber,
          hourlyCost: 1 as NonNegativeNumber,
          project,
          repeat: 0x0111010 as NonNegativeInteger
        },
        user1
      ),
      taskEither.chain(() =>
        dbGetAll(
          SQL`
            SELECT task.*, client.user
            FROM task
            JOIN project ON task.project = project.id
            JOIN client ON project.client = client.id
            WHERE task.project = ${project}
          `,
          DatabaseTask
        )
      ),
      testTaskEither(tasks => {
        expect(tasks.length).toBe(4)

        expect(tasks).toContainEqual(
          expect.objectContaining({
            start_time: new Date(1990, 0, 1, 10, 42)
          })
        )

        expect(tasks).toContainEqual(
          expect.objectContaining({
            start_time: new Date(1990, 0, 3, 10, 42)
          })
        )

        expect(tasks).toContainEqual(
          expect.objectContaining({
            start_time: new Date(1990, 0, 4, 10, 42)
          })
        )

        expect(tasks).toContainEqual(
          expect.objectContaining({
            start_time: new Date(1990, 0, 5, 10, 42)
          })
        )
      })
    )
  })

  it('should skip existing tasks', async () => {
    await pipe(
      insertTask(
        getFakeTask(project, {
          start_time: new Date(1990, 0, 3, 10, 42)
        })
      ),
      taskEither.chain(() =>
        createTasksBatch(
          {
            name: 'Task #' as NonEmptyString,
            start_time: new Date(1990, 0, 1, 10, 42),
            from: new Date(1990, 0, 1, 10, 0),
            to: new Date(1990, 0, 7, 10, 0),
            expectedWorkingHours: 8 as NonNegativeNumber,
            hourlyCost: 1 as NonNegativeNumber,
            project,
            repeat: 0x0111010 as NonNegativeInteger
          },
          user1
        )
      ),
      taskEither.chain(() =>
        dbGetAll(
          SQL`
            SELECT task.*, client.user
            FROM task
            JOIN project ON task.project = project.id
            JOIN client ON project.client = client.id
            WHERE task.project = ${project}
          `,
          DatabaseTask
        )
      ),
      testTaskEither(tasks => {
        expect(tasks.length).toBe(4)
      })
    )
  })
})

describe('getTask', () => {
  it('should work', async () => {
    await pipe(
      getTask(task1.id, user1),
      testTaskEither(task => {
        expect(task).toMatchObject(task1)
      })
    )
  })

  it("should not allow users to see other users' tasks", async () => {
    await pipe(
      getTask(task2.id, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})

describe('listTasks', () => {
  it("should list only the user's tasks", async () => {
    await pipe(
      listTasks({ name: option.none }, user1),
      testTaskEither(connection => {
        const tasks = getConnectionNodes(connection)

        expect(tasks).toContainEqual(expect.objectContaining({ id: task1.id }))

        expect(tasks).not.toContainEqual(
          expect.objectContaining({ id: task2.id })
        )
      })
    )
  })
})

describe('updateTask', () => {
  it('should work', async () => {
    const data = getFakeTask(project1.id)

    return pipe(
      updateTask(task1.id, data, user1),
      testTaskEither(task => {
        expect(Task.is(task)).toBe(true)
        task1 = task
      })
    )
  })

  it("should not allow users to update other users' tasks", async () => {
    await pipe(
      updateTask(task1.id, getFakeTask(project1.id), user2),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })

  it("should not allow users to assign to their tasks other users' projects", async () => {
    await pipe(
      updateTask(task1.id, getFakeTask(project2.id), user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})

describe('deleteTask', () => {
  let task1: Task
  let task2: Task

  beforeAll(async () => {
    await pipe(
      sequenceS(taskEither.taskEither)({
        t1: createTask(getFakeTask(project1.id), user1),
        t2: createTask(getFakeTask(project2.id), user2)
      }),
      testTaskEither(({ t1, t2 }) => {
        task1 = t1
        task2 = t2
      })
    )
  })

  it('should work', async () => {
    await pipe(
      deleteTask(task1.id, user1),
      testTaskEither(task => {
        expect(task).toMatchObject(task1)
      })
    )
  })

  it("should not allow users to delete other users' tasks", async () => {
    await pipe(
      deleteTask(task2.id, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})
