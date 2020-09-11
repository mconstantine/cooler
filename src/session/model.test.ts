import { User } from '../user/interface'
import { Task } from '../task/interface'
import { Session } from './interface'
import { getDatabase } from '../misc/getDatabase'
import { insert } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeTask } from '../test/getFakeTask'
import { getFakeSession } from '../test/getFakeSession'
import SQL from 'sql-template-strings'
import {
  createSession,
  listSessions,
  updateSession,
  deleteSession,
  getSession
} from './model'
import { ApolloError } from 'apollo-server-express'
import { init } from '../init'

let user1: User
let user2: User
let task1: Task
let task2: Task
let session1: Session
let session2: Session

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

  const task1Id = (await insert('task', getFakeTask({ project: project1Id })))
    .lastID!

  const task2Id = (await insert('task', getFakeTask({ project: project2Id })))
    .lastID!

  const session1Id = (
    await insert('session', getFakeSession({ task: task1Id, end_time: null }))
  ).lastID!

  const session2Id = (
    await insert('session', getFakeSession({ task: task2Id }))
  ).lastID!

  user1 = (await db.get(SQL`SELECT * FROM user WHERE id = ${user1Id}`)) as User
  user2 = (await db.get(SQL`SELECT * FROM user WHERE id = ${user2Id}`)) as User
  task1 = (await db.get(SQL`SELECT * FROM task WHERE id = ${task1Id}`)) as Task
  task2 = (await db.get(SQL`SELECT * FROM task WHERE id = ${task2Id}`)) as Task
  session1 = (await db.get(
    SQL`SELECT * FROM session WHERE id = ${session1Id}`
  )) as Session
  session2 = (await db.get(
    SQL`SELECT * FROM session WHERE id = ${session2Id}`
  )) as Session
})

describe('createSession', () => {
  it('should work', async () => {
    await createSession(getFakeSession({ task: task1.id }), user1)
  })

  it("should not allow users to create sessions for other users' tasks", async () => {
    await expect(async () => {
      await createSession(getFakeSession({ task: task2.id }), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it('should not allow the creation of an open session if there is one already', async () => {
    await expect(async () => {
      await createSession(
        getFakeSession({ task: task1.id, end_time: null }),
        user1
      )
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it('should allow the creation of an open session if there is one owned by another user', async () => {
    await createSession(
      getFakeSession({ task: task2.id, end_time: null }),
      user2
    )
  })
})

describe('getSession', () => {
  it('should work', async () => {
    expect(await getSession(session1.id, user1)).toMatchObject(session1)
  })

  it("should not allow users to see other users' sessions", async () => {
    await expect(async () => {
      await getSession(session2.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('listSessions', () => {
  it("should list only the user's sessions", async () => {
    const result = await listSessions({}, user1)

    expect(result.edges.map(({ node }) => node)).toContainEqual(
      expect.objectContaining({ id: session1.id })
    )

    expect(result.edges.map(({ node }) => node)).not.toContainEqual(
      expect.objectContaining({ id: session2.id })
    )
  })
})

describe('updateSession', () => {
  it('should work', async () => {
    const data = getFakeSession()
    const result = await updateSession(session2.id, data, user2)

    expect(result).toMatchObject(data)
    session2 = result!
  })

  it("should not allow users to update other users' sessions", async () => {
    await expect(async () => {
      await updateSession(session1.id, getFakeSession(), user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it("should not allow users to assign to their sessions other users' tasks", async () => {
    await expect(async () => {
      await updateSession(
        session1.id,
        getFakeSession({ task: task2.id }),
        user1
      )
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it('should not allow to reopen a session', async () => {
    await expect(async () => {
      await updateSession(session2.id, { end_time: null }, user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('deleteSession', () => {
  let session1: Session
  let session2: Session

  beforeAll(async () => {
    session1 = (await createSession(
      getFakeSession({ task: task1.id }),
      user1
    )) as Session
    session2 = (await createSession(
      getFakeSession({ task: task2.id }),
      user2
    )) as Session
  })

  it('should work', async () => {
    expect(await deleteSession(session1.id, user1)).toMatchObject(session1)
  })

  it("should not allow users to delete other users' sessions", async () => {
    await expect(async () => {
      await deleteSession(session2.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})
