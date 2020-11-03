import {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  getProject
} from './model'
import { User, UserFromDatabase } from '../user/interface'
import { Client, ClientFromDatabase } from '../client/interface'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { getFakeProject } from '../test/getFakeProject'
import { ApolloError } from 'apollo-server-express'
import { Project, ProjectFromDatabase } from './interface'
import { init } from '../init'
import { fromDatabase as userFromDatabase } from '../user/model'
import { fromDatabase as clientFromDatabase } from '../client/model'
import { fromDatabase } from './model'
import { definitely } from '../misc/definitely'
import { getConnectionNodes } from '../test/getConnectionNodes'
import { getID } from '../test/getID'
import { fromSQLDate } from '../misc/dbUtils'

let user1: User
let user2: User
let client1: Client
let client2: Client
let project1: Project
let project2: Project

beforeAll(async () => {
  await init()

  const db = await getDatabase()
  const user1Id = await getID('user', getFakeUser())
  const user2Id = await getID('user', getFakeUser())
  const client1Id = await getID('client', getFakeClient(user1Id))
  const client2Id = await getID('client', getFakeClient(user2Id))
  const project1Id = await getID('project', getFakeProject(client1Id))
  const project2Id = await getID('project', getFakeProject(client2Id))

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

  client1 = clientFromDatabase(
    definitely(
      await db.get<ClientFromDatabase>(
        SQL`SELECT * FROM client WHERE id = ${client1Id}`
      )
    )
  )

  client2 = clientFromDatabase(
    definitely(
      await db.get<ClientFromDatabase>(
        SQL`SELECT * FROM client WHERE id = ${client2Id}`
      )
    )
  )

  project1 = fromDatabase(
    definitely(
      await db.get<ProjectFromDatabase>(
        SQL`SELECT * FROM project WHERE id = ${project1Id}`
      )
    )
  )

  project2 = fromDatabase(
    definitely(
      await db.get<ProjectFromDatabase>(
        SQL`SELECT * FROM project WHERE id = ${project2Id}`
      )
    )
  )
})

describe('createProject', () => {
  it('should work', async () => {
    await createProject(getFakeProject(client1.id), user1)
  })

  it("should not allow users to create projects for other users' clients", async () => {
    await expect(async () => {
      await createProject(getFakeProject(client2.id), user1)
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

    expect(getConnectionNodes(results)).toContainEqual(
      expect.objectContaining({ id: project1.id })
    )

    expect(getConnectionNodes(results)).not.toContainEqual(
      expect.objectContaining({ id: project2.id })
    )
  })
})

describe('updateProject', () => {
  it('should work', async () => {
    const data = getFakeProject(client1.id)
    const result = definitely(await updateProject(project1.id, data, user1))

    expect(result).toMatchObject({
      ...data,
      cashed_at: data.cashed_at ? fromSQLDate(data.cashed_at) : null
    })

    project1 = result
  })

  it("should not allow users to update other users' projects", async () => {
    await expect(async () => {
      await updateProject(project1.id, getFakeProject(client1.id), user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it("should not allow users to assign to their projects other users' clients", async () => {
    await expect(async () => {
      await updateProject(project1.id, getFakeProject(client2.id), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('deleteProject', () => {
  let project1: Project
  let project2: Project

  beforeAll(async () => {
    project1 = definitely(
      await createProject(getFakeProject(client1.id), user1)
    )

    project2 = definitely(
      await createProject(getFakeProject(client2.id), user2)
    )
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
