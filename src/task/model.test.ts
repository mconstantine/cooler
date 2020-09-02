import initUser from '../user/init'
import initClient from '../client/init'
import initProject from '../project/init'
import initTask from './init'
import { User } from '../user/User'
import { insert } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { getFakeProject } from '../test/getFakeProject'
import { ApolloError } from 'apollo-server-express'
import { Project } from '../project/Project'
import { Task } from './Task'
import { getFakeTask } from '../test/getFakeTask'
import { createTask, listTasks, updateTask, deleteTask, getTask } from './model'

let user1: User
let user2: User
let project1: Project
let project2: Project
let task1: Task
let task2: Task

beforeAll(async () => {
  await initUser()
  await initClient()
  await initProject()
  await initTask()

  const db = await getDatabase()

  const user1Id = (
    await insert('user', getFakeUser())
  ).lastID!

  const user2Id = (
    await insert('user', getFakeUser())
  ).lastID!

  const client1Id = (
    await insert('client', getFakeClient({ user: user1Id }))
  ).lastID!

  const client2Id = (
    await insert('client', getFakeClient({ user: user2Id }))
  ).lastID!

  const project1Id = (
    await insert('project', getFakeProject({ client: client1Id }))
  ).lastID!

  const project2Id = (
    await insert('project', getFakeProject({ client: client2Id }))
  ).lastID!

  const task1Id = (
    await insert('task', getFakeTask({ project: project1Id }))
  ).lastID!

  const task2Id = (
    await insert('task', getFakeTask({ project: project2Id }))
  ).lastID!

  user1 = await db.get(SQL`SELECT * FROM user WHERE id = ${user1Id}`) as User
  user2 = await db.get(SQL`SELECT * FROM user WHERE id = ${user2Id}`) as User
  project1 = await db.get(SQL`SELECT * FROM project WHERE id = ${project1Id}`) as Project
  project2 = await db.get(SQL`SELECT * FROM project WHERE id = ${project2Id}`) as Project
  task1 = await db.get(SQL`SELECT * FROM task WHERE id = ${task1Id}`) as Task
  task2 = await db.get(SQL`SELECT * FROM task WHERE id = ${task2Id}`) as Task
})

describe('createTask', () => {
  it('should work', async () => {
    await createTask(getFakeTask({ project: project1.id }), user1)
  })

  it("should not allow users to create tasks for other users' projects", async () => {
    await expect(async () => {
      await createTask(getFakeTask({ project: project2.id }), user1)
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

    expect(
      results.edges.map(({ node }) => node)
    ).toContainEqual(
      expect.objectContaining({ id: task1.id })
    )

    expect(
      results.edges.map(({ node }) => node)
    ).not.toContainEqual(
      expect.objectContaining({ id: task2.id })
    )
  })
})

describe('updateTask', () => {
  it('should work', async () => {
    const data = getFakeTask()
    const result = await updateTask(task1.id, data, user1)

    expect(result).toMatchObject(data)
    task1 = result!
  })

  it("should not allow users to update other users' tasks", async () => {
    await expect(async () => {
      await updateTask(task1.id, getFakeTask(), user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it("should not allow users to assign to their tasks other users' projects", async () => {
    await expect(async () => {
      await updateTask(task1.id, getFakeTask({ project: project2.id }), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('deleteTask', () => {
  let task1: Task
  let task2: Task

  beforeAll(async () => {
    task1 = await createTask(getFakeTask({ project: project1.id }), user1) as Task
    task2 = await createTask(getFakeTask({ project: project2.id}), user2) as Task
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
