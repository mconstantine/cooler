import { init } from '../init'
import { User, UserFromDatabase } from '../user/interface'
import { insert } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { getFakeProject } from '../test/getFakeProject'
import { ApolloError } from 'apollo-server-express'
import { ProjectFromDatabase } from '../project/interface'
import { Task, TaskFromDatabase } from './interface'
import { getFakeTask } from '../test/getFakeTask'
import {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  getTask,
  fromDatabase,
  toDatabase
} from './model'
import { fromDatabase as userFromDatabase } from '../user/model'

let user1: User
let user2: User
let project1: ProjectFromDatabase
let project2: ProjectFromDatabase
let task1: Task
let task2: Task

beforeAll(async () => {
  await init()

  const db = await getDatabase()
  const user1Id = (await insert('user', getFakeUser())).lastID!
  const user2Id = (await insert('user', getFakeUser())).lastID!
  const client1Id = (await insert('client', getFakeClient(user1Id))).lastID!
  const client2Id = (await insert('client', getFakeClient(user2Id))).lastID!

  const project1Id = (await insert('project', getFakeProject(client1Id)))
    .lastID!

  const project2Id = (await insert('project', getFakeProject(client2Id)))
    .lastID!

  const task1Id = (await insert('task', toDatabase(getFakeTask(project1Id))))
    .lastID!

  const task2Id = (await insert('task', toDatabase(getFakeTask(project2Id))))
    .lastID!

  user1 = userFromDatabase(
    (await db.get<UserFromDatabase>(
      SQL`SELECT * FROM user WHERE id = ${user1Id}`
    ))!
  )

  user2 = userFromDatabase(
    (await db.get<UserFromDatabase>(
      SQL`SELECT * FROM user WHERE id = ${user2Id}`
    ))!
  )

  project1 = (await db.get<ProjectFromDatabase>(
    SQL`SELECT * FROM project WHERE id = ${project1Id}`
  ))!

  project2 = (await db.get<ProjectFromDatabase>(
    SQL`SELECT * FROM project WHERE id = ${project2Id}`
  ))!

  task1 = fromDatabase(
    (await db.get<TaskFromDatabase>(
      SQL`SELECT * FROM task WHERE id = ${task1Id}`
    ))!
  )

  task2 = fromDatabase(
    (await db.get<TaskFromDatabase>(
      SQL`SELECT * FROM task WHERE id = ${task2Id}`
    ))!
  )
})

describe('createTask', () => {
  it('should work', async () => {
    await createTask(getFakeTask(project1.id), user1)
  })

  it("should not allow users to create tasks for other users' projects", async () => {
    await expect(async () => {
      await createTask(getFakeTask(project2.id), user1)
    }).rejects.toBeInstanceOf(ApolloError)
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
    const data = getFakeTask(project1.id)

    // This time gets converted to an SQL date and then back to a JavaScript date, so it loses
    // precision
    data.start_time.setMilliseconds(0)

    const result = await updateTask(task1.id, data, user1)

    expect(result).toMatchObject(data)
    task1 = result!
  })

  it("should not allow users to update other users' tasks", async () => {
    await expect(async () => {
      await updateTask(task1.id, getFakeTask(project1.id), user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it("should not allow users to assign to their tasks other users' projects", async () => {
    await expect(async () => {
      await updateTask(task1.id, getFakeTask(project2.id), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('deleteTask', () => {
  let task1: Task
  let task2: Task

  beforeAll(async () => {
    task1 = (await createTask(getFakeTask(project1.id), user1))!
    task2 = (await createTask(getFakeTask(project2.id), user2))!
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
