import { init } from '../init'
import { User, UserFromDatabase } from '../user/interface'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { getFakeProject } from '../test/getFakeProject'
import { ApolloError } from 'apollo-server-express'
import { ProjectFromDatabase } from '../project/interface'
import { Task, TaskFromDatabase } from './interface'
import { getFakeTaskFromDatabase } from '../test/getFakeTask'
import {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  getTask,
  fromDatabase,
  toDatabase,
  createTasksBatch,
  getUserTasks
} from './model'
import {
  fromDatabase as userFromDatabase,
  toDatabase as userToDatabase
} from '../user/model'
import { getID } from '../test/getID'
import { definitely } from '../misc/definitely'
import { fromSQLDate, insert, remove, toSQLDate } from '../misc/dbUtils'

let user1: User
let user2: User
let project1: ProjectFromDatabase
let project2: ProjectFromDatabase
let task1: Task
let task2: Task

beforeAll(async () => {
  await init()

  const db = await getDatabase()
  const user1Id = await getID('user', getFakeUser())
  const user2Id = await getID('user', getFakeUser())
  const client1Id = await getID('client', getFakeClient(user1Id))
  const client2Id = await getID('client', getFakeClient(user2Id))
  const project1Id = await getID('project', getFakeProject(client1Id))
  const project2Id = await getID('project', getFakeProject(client2Id))
  const task1Id = await getID('task', getFakeTaskFromDatabase(project1Id))
  const task2Id = await getID('task', getFakeTaskFromDatabase(project2Id))

  user1 = userFromDatabase(
    definitely(
      await db.get<UserFromDatabase>(
        SQL`SELECT * FROM user WHERE id = ${user1Id}`
      )
    )
  )

  user2 = userFromDatabase(
    definitely(
      await db.get<UserFromDatabase>(
        SQL`SELECT * FROM user WHERE id = ${user2Id}`
      )
    )
  )

  project1 = definitely(
    await db.get<ProjectFromDatabase>(
      SQL`SELECT * FROM project WHERE id = ${project1Id}`
    )
  )

  project2 = definitely(
    await db.get<ProjectFromDatabase>(
      SQL`SELECT * FROM project WHERE id = ${project2Id}`
    )
  )

  task1 = fromDatabase(
    definitely(
      await db.get<TaskFromDatabase>(
        SQL`SELECT * FROM task WHERE id = ${task1Id}`
      )
    )
  )

  task2 = fromDatabase(
    definitely(
      await db.get<TaskFromDatabase>(
        SQL`SELECT * FROM task WHERE id = ${task2Id}`
      )
    )
  )
})

describe('getTodayTasks', () => {
  let user: User
  let task1: Task
  let task2: Task

  beforeAll(async () => {
    const db = await getDatabase()
    const userId = await getID('user', getFakeUser())
    const clientId = await getID('client', getFakeClient(userId))
    const projectId = await getID('project', getFakeProject(clientId))

    const task1Id = await getID(
      'task',
      getFakeTaskFromDatabase(projectId, {
        start_time: toSQLDate(new Date())
      })
    )

    const task2Id = await getID(
      'task',
      getFakeTaskFromDatabase(projectId, {
        start_time: toSQLDate(new Date(Date.now() + 86400000))
      })
    )

    user = userFromDatabase(
      definitely(
        await db.get<UserFromDatabase>(
          SQL`SELECT * FROM user WHERE id = ${userId}`
        )
      )
    )

    task1 = fromDatabase(
      definitely(
        await db.get<TaskFromDatabase>(
          SQL`SELECT * FROM task WHERE id = ${task1Id}`
        )
      )
    )

    task2 = fromDatabase(
      definitely(
        await db.get<TaskFromDatabase>(
          SQL`SELECT * FROM task WHERE id = ${task2Id}`
        )
      )
    )
  })

  afterAll(async () => {
    await remove('user', { id: user.id })
  })

  it('should work', async () => {
    const now = new Date()

    const tasks = await getUserTasks(userToDatabase(user), {
      from: toSQLDate(
        new Date(now.getFullYear(), now.getMonth(), now.getDate())
      ),
      to: toSQLDate(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      )
    })

    expect(tasks.edges.map(({ node }) => node)).toContainEqual(
      expect.objectContaining({
        id: task1.id
      })
    )

    expect(tasks.edges.map(({ node }) => node)).not.toContainEqual(
      expect.objectContaining({
        id: task2.id
      })
    )
  })
})

describe('createTask', () => {
  it('should work', async () => {
    await createTask(getFakeTaskFromDatabase(project1.id), user1)
  })

  it("should not allow users to create tasks for other users' projects", async () => {
    await expect(async () => {
      await createTask(getFakeTaskFromDatabase(project2.id), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('createTasksBatch', () => {
  let project: number

  beforeAll(async () => {
    project = definitely(
      await insert('project', getFakeProject(project1.client))
    ).lastID!
  })

  afterEach(async () => {
    await remove('task', { project })
  })

  afterAll(async () => {
    await remove('project', { id: project })
  })

  it('should copy expected working hours, hourly cost and start time', async () => {
    expect.assertions(21)

    await createTasksBatch(
      {
        name: 'Task #',
        expectedWorkingHours: 8,
        hourlyCost: 1,
        project,
        start_time: toSQLDate(new Date(1990, 0, 1, 10, 42)),
        from: toSQLDate(new Date(1990, 0, 1, 10, 0)),
        to: toSQLDate(new Date(1990, 0, 5, 10, 0)),
        repeat: 0x1111111
      },
      user1
    )

    const db = await getDatabase()
    const tasks = await db.all<TaskFromDatabase[]>(
      `SELECT * FROM task WHERE project = ${project}`
    )

    expect(tasks.length).toBe(5)

    tasks.forEach(task => {
      expect(task.expectedWorkingHours).toBe(8)
      expect(task.hourlyCost).toBe(1)

      const startTime = fromSQLDate(task.start_time)

      expect(startTime.getHours()).toBe(10)
      expect(startTime.getMinutes()).toBe(42)
    })
  })

  it('should format dates correctly', async () => {
    await createTasksBatch(
      {
        name: 'D-DD-DDD-DDDD, M/MM/MMM/MMMM, YY / YYYY ADAMY',
        start_time: toSQLDate(new Date(1990, 0, 1, 10, 42)),
        from: toSQLDate(new Date(1990, 0, 1, 10, 0)),
        to: toSQLDate(new Date(1990, 0, 1, 10, 0)),
        expectedWorkingHours: 8,
        hourlyCost: 1,
        project,
        repeat: 0x1111111
      },
      user1
    )

    const db = await getDatabase()
    const tasks = await db.all<TaskFromDatabase[]>(
      SQL`SELECT * FROM task WHERE project = ${project}`
    )

    expect(tasks.length).toBe(1)
    expect(tasks[0].name).toBe(
      '1-01-Mon-Monday, 1/01/Jan/January, 90 / 1990 ADAMY'
    )
  })

  it('should format indexes correctly', async () => {
    await createTasksBatch(
      {
        name: 'Task #',
        start_time: toSQLDate(new Date(1990, 0, 1, 10, 42)),
        from: toSQLDate(new Date(1990, 0, 1, 10, 0)),
        to: toSQLDate(new Date(1990, 0, 5, 10, 0)),
        expectedWorkingHours: 8,
        hourlyCost: 1,
        project,
        repeat: 0x1111111
      },
      user1
    )

    const db = await getDatabase()
    const tasks = await db.all<TaskFromDatabase[]>(
      SQL`SELECT * FROM task WHERE project = ${project}`
    )

    expect(tasks.length).toBe(5)
    expect(tasks[0].name).toBe('Task 1')
    expect(tasks[1].name).toBe('Task 2')
    expect(tasks[2].name).toBe('Task 3')
    expect(tasks[3].name).toBe('Task 4')
    expect(tasks[4].name).toBe('Task 5')
  })

  it('should understand repeat with bit masks', async () => {
    await createTasksBatch(
      {
        name: 'Task #',
        start_time: toSQLDate(new Date(1990, 0, 1, 10, 42)),
        from: toSQLDate(new Date(1990, 0, 1, 10, 0)),
        to: toSQLDate(new Date(1990, 0, 7, 10, 0)),
        expectedWorkingHours: 8,
        hourlyCost: 1,
        project,
        repeat: 0x0111010
      },
      user1
    )

    const db = await getDatabase()
    const tasks = await db.all<TaskFromDatabase[]>(
      SQL`SELECT * FROM task WHERE project = ${project}`
    )

    expect(tasks.length).toBe(4)

    expect(tasks).toContainEqual(
      expect.objectContaining({
        start_time: toSQLDate(new Date(1990, 0, 1, 10, 42))
      })
    )
    expect(tasks).toContainEqual(
      expect.objectContaining({
        start_time: toSQLDate(new Date(1990, 0, 3, 10, 42))
      })
    )
    expect(tasks).toContainEqual(
      expect.objectContaining({
        start_time: toSQLDate(new Date(1990, 0, 4, 10, 42))
      })
    )
    expect(tasks).toContainEqual(
      expect.objectContaining({
        start_time: toSQLDate(new Date(1990, 0, 5, 10, 42))
      })
    )
  })

  it('should skip existing tasks', async () => {
    await insert('task', {
      name: 'Existing task',
      expectedWorkingHours: 8,
      hourlyCost: 1,
      project,
      start_time: toSQLDate(new Date(1990, 0, 3, 10, 42))
    })

    await createTasksBatch(
      {
        name: 'Task #',
        start_time: toSQLDate(new Date(1990, 0, 1, 10, 42)),
        from: toSQLDate(new Date(1990, 0, 1, 10, 0)),
        to: toSQLDate(new Date(1990, 0, 7, 10, 0)),
        expectedWorkingHours: 8,
        hourlyCost: 1,
        project,
        repeat: 0x0111010
      },
      user1
    )

    const db = await getDatabase()
    const tasks = await db.all<TaskFromDatabase[]>(
      SQL`SELECT * FROM task WHERE project = ${project}`
    )

    expect(tasks.length).toBe(4)
  })
})

describe('getTask', () => {
  it('should work', async () => {
    expect(await getTask(task1.id, user1)).toMatchObject(task1)
  })

  it("should not allow users to see other users' tasks", async () => {
    await expect(async () => {
      await getTask(task2.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('listTasks', () => {
  it("should list only the user's tasks", async () => {
    const results = await listTasks({}, user1)

    expect(results.edges.map(({ node }) => node)).toContainEqual(
      expect.objectContaining({ id: task1.id })
    )

    expect(results.edges.map(({ node }) => node)).not.toContainEqual(
      expect.objectContaining({ id: task2.id })
    )
  })
})

describe('updateTask', () => {
  it('should work', async () => {
    const data = getFakeTaskFromDatabase(project1.id)
    const result = definitely(await updateTask(task1.id, data, user1))

    expect(toDatabase(result)).toMatchObject(data)
    task1 = result
  })

  it("should not allow users to update other users' tasks", async () => {
    await expect(async () => {
      await updateTask(task1.id, getFakeTaskFromDatabase(project1.id), user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it("should not allow users to assign to their tasks other users' projects", async () => {
    await expect(async () => {
      await updateTask(task1.id, getFakeTaskFromDatabase(project2.id), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('deleteTask', () => {
  let task1: Task
  let task2: Task

  beforeAll(async () => {
    task1 = definitely(
      await createTask(getFakeTaskFromDatabase(project1.id), user1)
    )

    task2 = definitely(
      await createTask(getFakeTaskFromDatabase(project2.id), user2)
    )
  })

  it('should work', async () => {
    expect(await deleteTask(task1.id, user1)).toMatchObject(task1)
  })

  it("should not allow users to delete other users' tasks", async () => {
    await expect(async () => {
      await deleteTask(task2.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})
