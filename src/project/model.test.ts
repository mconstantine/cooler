import {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  getProject
} from './model'
import { User } from '../user/interface'
import { Client } from '../client/interface'
import { insert } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { getFakeProject } from '../test/getFakeProject'
import { ApolloError } from 'apollo-server-express'
import { Project } from './interface'
import { init } from '../init'

let user1: User
let user2: User
let client1: Client
let client2: Client
let project1: Project
let project2: Project

beforeAll(async () => {
  await init()

  const db = await getDatabase()
  const user1Id = (await insert('user', getFakeUser())).lastID!
  const user2Id = (await insert('user', getFakeUser())).lastID!
  const client1Id = (await insert('client', getFakeClient(user1Id))).lastID!
  const client2Id = (await insert('client', getFakeClient(user2Id))).lastID!

  const project1Id = (
    await insert('project', getFakeProject({ client: client1Id }))
  ).lastID!

  const project2Id = (
    await insert('project', getFakeProject({ client: client2Id }))
  ).lastID!

  user1 = (await db.get(SQL`SELECT * FROM user WHERE id = ${user1Id}`)) as User
  user2 = (await db.get(SQL`SELECT * FROM user WHERE id = ${user2Id}`)) as User
  client1 = (await db.get(
    SQL`SELECT * FROM client WHERE id = ${client1Id}`
  )) as Client
  client2 = (await db.get(
    SQL`SELECT * FROM client WHERE id = ${client2Id}`
  )) as Client
  project1 = (await db.get(
    SQL`SELECT * FROM project WHERE id = ${project1Id}`
  )) as Project
  project2 = (await db.get(
    SQL`SELECT * FROM project WHERE id = ${project2Id}`
  )) as Project
})

describe('createProject', () => {
  it('should work', async () => {
    await createProject(getFakeProject({ client: client1.id }), user1)
  })

  it("should not allow users to create projects for other users' clients", async () => {
    await expect(async () => {
      await createProject(getFakeProject({ client: client2.id }), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('getProject', () => {
  it('should work', async () => {
    expect(await getProject(project1.id, user1)).toMatchObject(project1)
  })

  it("should not allow users to see other users' projects", async () => {
    await expect(async () => {
      await getProject(project2.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('listProjects', () => {
  it("should list only the user's projects", async () => {
    const results = await listProjects({}, user1)

    expect(results.edges.map(({ node }) => node)).toContainEqual(
      expect.objectContaining({ id: project1.id })
    )

    expect(results.edges.map(({ node }) => node)).not.toContainEqual(
      expect.objectContaining({ id: project2.id })
    )
  })
})

describe('updateProject', () => {
  it('should work', async () => {
    const data = getFakeProject()
    const result = await updateProject(project1.id, data, user1)

    expect(result).toMatchObject(data)
    project1 = result!
  })

  it("should not allow users to update other users' projects", async () => {
    await expect(async () => {
      await updateProject(project1.id, getFakeProject(), user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it("should not allow users to assign to their projects other users' clients", async () => {
    await expect(async () => {
      await updateProject(
        project1.id,
        getFakeProject({ client: client2.id }),
        user1
      )
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('deleteProject', () => {
  let project1: Project
  let project2: Project

  beforeAll(async () => {
    project1 = (await createProject(
      getFakeProject({ client: client1.id }),
      user1
    )) as Project
    project2 = (await createProject(
      getFakeProject({ client: client2.id }),
      user2
    )) as Project
  })

  it('should work', async () => {
    expect(await deleteProject(project1.id, user1)).toMatchObject(project1)
  })

  it("should not allow users to delete other users' projects", async () => {
    await expect(async () => {
      await deleteProject(project2.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})
