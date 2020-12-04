import { User } from '../user/interface'
import { dbRun } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import { getFakeTask } from '../test/getFakeTask'
import { getFakeSession } from '../test/getFakeSession'
import SQL from 'sql-template-strings'
import {
  startSession,
  listSessions,
  updateSession,
  deleteSession,
  getSession,
  stopSession
} from './model'
import { init } from '../init'
import { getConnectionNodes } from '../test/getConnectionNodes'
import { DatabaseTask } from '../task/interface'
import { DatabaseSession, Session } from './interface'
import { option, taskEither } from 'fp-ts'
import { registerUser } from '../test/registerUser'
import {
  pipeTestTaskEither,
  testError,
  testTaskEither,
  testTaskEitherError
} from '../test/util'
import { pipe, constVoid, identity } from 'fp-ts/function'
import { sequenceS, sequenceT } from 'fp-ts/Apply'
import { insertClient } from '../client/database'
import { insertProject } from '../project/database'
import { getTaskById, insertTask } from '../task/database'
import { getSessionById, insertSession } from './database'

let user1: User
let user2: User
let task1: DatabaseTask
let task2: DatabaseTask
let session1: DatabaseSession
let session2: DatabaseSession

beforeAll(async () => {
  process.env.SECRET = 'shhhhh'

  await pipe(
    init(),
    taskEither.chain(() => registerUser(getFakeUser())),
    pipeTestTaskEither(u => {
      user1 = u
    }),
    testTaskEither(constVoid)
  )

  await pipe(
    registerUser(getFakeUser(), user1),
    pipeTestTaskEither(u => {
      user2 = u
    }),
    testTaskEither(constVoid)
  )

  const { client1Id, client2Id } = await pipe(
    sequenceS(taskEither.taskEither)({
      client1Id: insertClient(getFakeClient(user1.id)),
      client2Id: insertClient(getFakeClient(user2.id))
    }),
    testTaskEither(identity)
  )

  const { project1Id, project2Id } = await pipe(
    sequenceS(taskEither.taskEither)({
      project1Id: insertProject(getFakeProject(client1Id)),
      project2Id: insertProject(getFakeProject(client2Id))
    }),
    testTaskEither(identity)
  )

  await pipe(
    sequenceS(taskEither.taskEither)({
      t1: pipe(
        insertTask(getFakeTask(project1Id)),
        taskEither.chain(id => getTaskById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      ),
      t2: pipe(
        insertTask(getFakeTask(project2Id)),
        taskEither.chain(id => getTaskById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      )
    }),
    pipeTestTaskEither(({ t1, t2 }) => {
      task1 = t1
      task2 = t2
    }),
    testTaskEither(constVoid)
  )

  await pipe(
    sequenceS(taskEither.taskEither)({
      s1: pipe(
        insertSession(getFakeSession(task1.id)),
        taskEither.chain(id => getSessionById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      ),
      s2: pipe(
        insertSession(getFakeSession(task2.id)),
        taskEither.chain(id => getSessionById(id)),
        taskEither.chain(taskEither.fromOption(testError))
      )
    }),
    pipeTestTaskEither(({ s1, s2 }) => {
      session1 = s1
      session2 = s2
    }),
    testTaskEither(constVoid)
  )
})

describe('startSession', () => {
  afterEach(async () => {
    await pipe(
      dbRun(SQL`
        DELETE FROM session
        WHERE id != ${session1.id} AND id != ${session2.id}
      `),
      testTaskEither(constVoid)
    )
  })

  it('should work', async () => {
    await pipe(
      startSession(task1.id, user1),
      testTaskEither(session => {
        expect(Session.is(session)).toBe(true)
        expect(session.start_time).toBeInstanceOf(Date)
        expect(option.isNone(session.end_time)).toBe(true)
      })
    )
  })

  it("should not allow users to create sessions for other users' tasks", async () => {
    await pipe(
      startSession(task2.id, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })

  it('should not allow to open more than one session per task', async () => {
    await pipe(
      startSession(task1.id, user1),
      pipeTestTaskEither(constVoid),
      taskEither.chain(() => startSession(task1.id, user1)),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_409')
      })
    )
  })
})

describe('stopSession', () => {
  it('should work', async () => {
    await pipe(
      startSession(task1.id, user1),
      pipeTestTaskEither(session => {
        expect(option.isNone(session.end_time)).toBe(true)
      }),
      taskEither.chain(session => stopSession(session.id, user1)),
      testTaskEither(session => {
        expect(Session.is(session)).toBe(true)
        expect(option.isSome(session.end_time)).toBe(true)
      })
    )
  })
})

describe('getSession', () => {
  it('should work', async () => {
    await pipe(
      getSession(session1.id, user1),
      testTaskEither(session => {
        expect(session).toMatchObject(session1)
      })
    )
  })

  it("should not allow users to see other users' sessions", async () => {
    await pipe(
      getSession(session2.id, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})

describe('listSessions', () => {
  it("should list only the user's sessions", async () => {
    await pipe(
      listSessions({ task: option.none }, user1),
      testTaskEither(connection => {
        const sessions = getConnectionNodes(connection)

        expect(sessions).toContainEqual(
          expect.objectContaining({ id: session1.id })
        )

        expect(sessions).not.toContainEqual(
          expect.objectContaining({ id: session2.id })
        )
      })
    )
  })
})

describe('updateSession', () => {
  it('should work', async () => {
    const data = getFakeSession(task2.id)

    await pipe(
      updateSession(session2.id, data, user2),
      pipeTestTaskEither(session => {
        expect(session).toMatchObject(data)
      }),
      taskEither.chain(session => getSessionById(session.id)),
      taskEither.chain(taskEither.fromOption(testError)),
      pipeTestTaskEither(session => {
        session2 = session
      }),
      testTaskEither(constVoid)
    )
  })

  it("should not allow users to update other users' sessions", async () => {
    await pipe(
      updateSession(session1.id, getFakeSession(task1.id), user2),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })

  it("should not allow users to assign to their sessions other users' tasks", async () => {
    await pipe(
      updateSession(session1.id, getFakeSession(task2.id), user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })

  it('should not allow to reopen a session', async () => {
    await pipe(
      updateSession(session2.id, { end_time: option.some(new Date()) }, user2),
      pipeTestTaskEither(constVoid),
      taskEither.chain(() =>
        updateSession(session2.id, { end_time: option.none }, user2)
      ),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_409')
      })
    )
  })
})

describe('deleteSession', () => {
  let session1: Session
  let session2: Session

  beforeEach(async () => {
    await pipe(
      sequenceS(taskEither.taskEither)({
        s1: startSession(task1.id, user1),
        s2: startSession(task2.id, user2)
      }),
      pipeTestTaskEither(({ s1, s2 }) => {
        session1 = s1
        session2 = s2
      }),
      testTaskEither(constVoid)
    )
  })

  afterEach(async () => {
    await sequenceT(taskEither.taskEither)(
      stopSession(session1.id, user1),
      stopSession(session2.id, user2)
    )()
  })

  it('should work', async () => {
    await pipe(
      deleteSession(session1.id, user1),
      testTaskEither(session => {
        expect(Session.is(session)).toBe(true)
        expect(session).toMatchObject(session1)
      })
    )
  })

  it("should not allow users to delete other users' sessions", async () => {
    await pipe(
      deleteSession(session2.id, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})
