import { User, UserFromDatabase } from '../user/interface'
import { TaskFromDatabase } from '../task/interface'
import { Session, SessionFromDatabase } from './interface'
import { getDatabase } from '../misc/getDatabase'
import { insert, remove, toSQLDate, update } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeTaskFromDatabase } from '../test/getFakeTask'
import { getFakeSessionFromDatabase } from '../test/getFakeSession'
import SQL from 'sql-template-strings'
import {
  startSession,
  listSessions,
  updateSession,
  deleteSession,
  getSession,
  toDatabase,
  fromDatabase,
  stopSession
} from './model'
import { ApolloError } from 'apollo-server-express'
import { init } from '../init'
import { definitely } from '../misc/definitely'
import { fromDatabase as userFromDatabase } from '../user/model'
import { getConnectionNodes } from '../test/getConnectionNodes'

let user1: User
let user2: User
let task1: TaskFromDatabase
let task2: TaskFromDatabase
let session1: Session
let session2: Session

beforeAll(async () => {
  await init()

  const db = await getDatabase()
  const user1Id = definitely((await insert('user', getFakeUser())).lastID)
  const user2Id = definitely((await insert('user', getFakeUser())).lastID)

  const client1Id = definitely(
    (await insert('client', getFakeClient(user1Id))).lastID
  )
  const client2Id = definitely(
    (await insert('client', getFakeClient(user2Id))).lastID
  )

  const project1Id = definitely(
    (await insert('project', getFakeProject(client1Id))).lastID
  )

  const project2Id = definitely(
    (await insert('project', getFakeProject(client2Id))).lastID
  )

  const task1Id = definitely(
    (await insert('task', getFakeTaskFromDatabase(project1Id))).lastID
  )

  const task2Id = definitely(
    (await insert('task', getFakeTaskFromDatabase(project2Id))).lastID
  )

  const session1Id = definitely(
    (await insert('session', getFakeSessionFromDatabase(task1Id))).lastID
  )

  const session2Id = definitely(
    (await insert('session', getFakeSessionFromDatabase(task2Id))).lastID
  )

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

  task1 = definitely(
    await db.get<TaskFromDatabase>(
      SQL`SELECT * FROM task WHERE id = ${task1Id}`
    )
  )

  task2 = definitely(
    await db.get<TaskFromDatabase>(
      SQL`SELECT * FROM task WHERE id = ${task2Id}`
    )
  )

  session1 = fromDatabase(
    definitely(
      await db.get<SessionFromDatabase>(
        SQL`SELECT * FROM session WHERE id = ${session1Id}`
      )
    )
  )

  session2 = fromDatabase(
    definitely(
      await db.get<SessionFromDatabase>(
        SQL`SELECT * FROM session WHERE id = ${session2Id}`
      )
    )
  )
})

describe('startSession', () => {
  it('should work', async () => {
    const session = definitely(await startSession(task1.id, user1))
    await remove('session', { id: session.id })
  })

  it("should not allow users to create sessions for other users' tasks", async () => {
    await expect(async () => {
      await startSession(task2.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it('should not allow the creation of an open session if there is one already', async () => {
    await update('session', {
      id: session1.id,
      end_time: null
    })

    await expect(async () => {
      await startSession(task1.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)

    await update('session', {
      id: session1.id,
      end_time: toSQLDate(definitely(session1.end_time))
    })
  })

  it('should allow the creation of an open session if there is one owned by another user', async () => {
    const session = definitely(await startSession(task2.id, user2))
    await stopSession(session.id, user2)
  })
})

describe('stopSession', () => {
  it('should work', async () => {
    let session = definitely(await startSession(task1.id, user1))
    expect(session.end_time).toBeNull()
    session = definitely(await stopSession(session.id, user1))
    expect(session.end_time).not.toBeNull()
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

    expect(getConnectionNodes(result)).toContainEqual(
      expect.objectContaining({ id: session1.id })
    )

    expect(getConnectionNodes(result)).not.toContainEqual(
      expect.objectContaining({ id: session2.id })
    )
  })
})

describe('updateSession', () => {
  it('should work', async () => {
    const data = getFakeSessionFromDatabase(task2.id)
    const result = definitely(await updateSession(session2.id, data, user2))

    expect(toDatabase(result)).toMatchObject(data)
    session2 = result
  })

  it("should not allow users to update other users' sessions", async () => {
    await expect(async () => {
      await updateSession(
        session1.id,
        getFakeSessionFromDatabase(task1.id),
        user2
      )
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it("should not allow users to assign to their sessions other users' tasks", async () => {
    await expect(async () => {
      await updateSession(
        session1.id,
        getFakeSessionFromDatabase(task2.id),
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
    session1 = definitely(await startSession(task1.id, user1))
    session2 = definitely(await startSession(task2.id, user2))
  })

  afterAll(async () => {
    await stopSession(session1.id, user1)
    await stopSession(session2.id, user2)
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
