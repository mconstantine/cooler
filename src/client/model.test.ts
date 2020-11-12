import { getFakeUser } from '../test/getFakeUser'
import { User } from '../user/interface'
import { getFakeClient } from '../test/getFakeClient'
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  updateClient
} from './model'
import { Client, foldClient } from './interface'
import { init } from '../init'
import { pipe } from 'fp-ts/lib/pipeable'
import { taskEither } from 'fp-ts'
import { registerUser } from '../test/registerUser'
import {
  pipeTestTaskEither,
  testError,
  testTaskEither,
  testTaskEitherError
} from '../test/util'
import { sequenceS } from 'fp-ts/lib/Apply'
import { remove } from '../misc/dbUtils'
import { getConnectionNodes } from '../test/getConnectionNodes'

let user1: User
let user2: User
let client1: Client
let client2: Client

beforeAll(async () => {
  process.env.SECRET = 'shhhhh'

  await init()()

  await pipe(
    sequenceS(taskEither.taskEither)({
      u1: registerUser(getFakeUser()),
      u2: registerUser(getFakeUser())
    }),
    testTaskEither(({ u1, u2 }) => {
      user1 = u1
      user2 = u2
    })
  )

  await pipe(
    sequenceS(taskEither.taskEither)({
      c1: createClient(getFakeClient(user1.id), user1),
      c2: createClient(getFakeClient(user2.id), user2)
    }),
    testTaskEither(({ c1, c2 }) => {
      client1 = c1
      client2 = c2
    })
  )
})

afterAll(async () => {
  delete process.env.SECRET
  await remove('user')()
})

describe('createClient', () => {
  it('should set the user automatically', async () => {
    const client = getFakeClient(user2.id)

    await pipe(
      createClient(client, user1),
      testTaskEither(result => {
        expect(client.user).toBe(user2.id)
        expect(result.user).toBe(user1.id)
      })
    )
  })
})

describe('getClient', () => {
  it('should work', async () => {
    await pipe(
      getClient(client1.id, user1),
      testTaskEither(client => {
        expect(client).toMatchObject(client1)
      })
    )
  })

  it("should not allow users to see other users' clients", async () => {
    await pipe(
      getClient(client2.id, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})

describe('listClients', () => {
  it("should list only the user's clients", async () => {
    await pipe(
      listClients({}, user1),
      testTaskEither(connection => {
        const clients = getConnectionNodes(connection)

        expect(clients).toContainEqual(
          expect.objectContaining({ id: client1.id })
        )

        expect(clients).not.toContainEqual(
          expect.objectContaining({ id: client2.id })
        )
      })
    )
  })
})

describe('updateClient', () => {
  it('should work', async () => {
    const data = getFakeClient(user1.id)

    await pipe(
      updateClient(client1.id, data, user1),
      testTaskEither(client => {
        expect(client).toMatchObject(data)
        client1 = client
      })
    )
  })

  it("should not allow users to update other users' clients", async () => {
    const data = getFakeClient(user2.id)

    await pipe(
      updateClient(client1.id, data, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })

  it('should switch from a BUSINESS to a PRIVATE client correctly', async () => {
    await pipe(
      getFakeClient(user1.id, { type: 'BUSINESS' }),
      client => createClient(client, user1),
      taskEither.chain(
        foldClient(
          () => taskEither.left(testError()),
          client => taskEither.right(client)
        )
      ),
      pipeTestTaskEither(client => {
        expect(client.country_code).not.toBe(null)
        expect(client.vat_number).not.toBe(null)
        expect(client.business_name).not.toBe(null)
      }),
      taskEither.chain(({ id }) =>
        pipe(
          getFakeClient(user1.id, { type: 'PRIVATE' }),
          client => updateClient(id, client, user1),
          taskEither.chain(
            foldClient(
              client => taskEither.right(client),
              () => taskEither.left(testError())
            )
          )
        )
      ),
      testTaskEither(client => {
        expect(client.fiscal_code).not.toBe(null)
        expect(client.first_name).not.toBe(null)
        expect(client.last_name).not.toBe(null)
      })
    )
  })

  it('should switch from a PRIVATE to a BUSINESS client correctly', async () => {
    await pipe(
      getFakeClient(user1.id, { type: 'PRIVATE' }),
      client => createClient(client, user1),
      taskEither.chain(
        foldClient(
          client => taskEither.right(client),
          () => taskEither.left(testError())
        )
      ),
      pipeTestTaskEither(client => {
        expect(client.fiscal_code).not.toBe(null)
        expect(client.first_name).not.toBe(null)
        expect(client.last_name).not.toBe(null)
      }),
      taskEither.chain(({ id }) =>
        pipe(
          getFakeClient(user1.id, { type: 'BUSINESS' }),
          client => updateClient(id, client, user1),
          taskEither.chain(
            foldClient(
              () => taskEither.left(testError()),
              client => taskEither.right(client)
            )
          )
        )
      ),
      testTaskEither(client => {
        expect(client.country_code).not.toBe(null)
        expect(client.vat_number).not.toBe(null)
        expect(client.business_name).not.toBe(null)
      })
    )
  })
})

describe('deleteClient', () => {
  let client1: Client
  let client2: Client

  beforeAll(async () => {
    await pipe(
      createClient(getFakeClient(user1.id), user1),
      testTaskEither(client => {
        client1 = client
      })
    )

    await pipe(
      createClient(getFakeClient(user2.id), user2),
      testTaskEither(client => {
        client2 = client
      })
    )
  })

  it('should work', async () => {
    await pipe(
      deleteClient(client1.id, user1),
      testTaskEither(client => {
        expect(client).toMatchObject(client1)
      })
    )
  })

  it("should not allow users to delete other users' clients", async () => {
    await pipe(
      deleteClient(client2.id, user1),
      testTaskEitherError(error => {
        expect(error.extensions.code).toBe('COOLER_403')
      })
    )
  })
})
