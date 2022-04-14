import { getFakeUser } from '../test/getFakeUser'
import { User, userCollection } from '../user/interface'
import { getFakeClient } from '../test/getFakeClient'
import { createClient, deleteClient, getClient, updateClient } from './model'
import { Client, clientCollection, foldClient } from './interface'
import { constVoid, pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { registerUser } from '../test/registerUser'
import {
  pipeTestTaskEither,
  testError,
  testTaskEither,
  testTaskEitherError
} from '../test/util'
import { sequenceS } from 'fp-ts/Apply'
import { WithId } from 'mongodb'
import { deleteMany } from '../misc/dbUtils'

let user1: WithId<User>
let user2: WithId<User>
let client1: WithId<Client>
let client2: WithId<Client>

beforeAll(async () => {
  process.env.SECRET = 'shhhhh'

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
      c1: createClient(getFakeClient(user1._id), user1),
      c2: createClient(getFakeClient(user2._id), user2)
    }),
    testTaskEither(({ c1, c2 }) => {
      client1 = c1
      client2 = c2
    })
  )
})

afterAll(
  async () =>
    await pipe(
      taskEither.rightIO(() => {
        delete process.env.SECRET
      }),
      taskEither.chain(() => deleteMany(userCollection, {})),
      taskEither.chain(() => deleteMany(clientCollection, {})),
      testTaskEither(constVoid)
    )
)

describe('createClient', () => {
  it('should set the user automatically', async () => {
    const client = getFakeClient(user2._id)

    await pipe(
      createClient(client, user1),
      testTaskEither(result => {
        expect(client.user).toEqual(user2._id)
        expect(result.user).toEqual(user1._id)
      })
    )
  })
})

describe('getClient', () => {
  it('should work', async () => {
    await pipe(
      getClient(client1._id, user1),
      testTaskEither(client => {
        expect(client).toMatchObject(client1)
      })
    )
  })

  it("should not allow users to see other users' clients", async () => {
    await pipe(
      getClient(client2._id, user1),
      testTaskEitherError(error => {
        expect(error.code).toBe('COOLER_403')
      })
    )
  })
})

// // describe('listClients', () => {
// //   it("should list only the user's clients", async () => {
// //     await pipe(
// //       listClients({ name: option.none }, user1),
// //       testTaskEither(connection => {
// //         const clients = getConnectionNodes(connection)

// //         expect(clients).toContainEqual(
// //           expect.objectContaining({ id: client1.id })
// //         )

// //         expect(clients).not.toContainEqual(
// //           expect.objectContaining({ id: client2.id })
// //         )
// //       })
// //     )
// //   })
// // })

describe('updateClient', () => {
  it('should work', async () => {
    const data = getFakeClient(user1._id)

    await pipe(
      updateClient(client1._id, data, user1),
      testTaskEither(client => {
        expect(client).toMatchObject(data)
        client1 = client
      })
    )
  })

  it("should not allow users to update other users' clients", async () => {
    const data = getFakeClient(user2._id)

    await pipe(
      updateClient(client1._id, data, user1),
      testTaskEitherError(error => {
        expect(error.code).toBe('COOLER_403')
      })
    )
  })

  it('should switch from a BUSINESS to a PRIVATE client correctly', async () => {
    await pipe(
      getFakeClient(user1._id, { type: 'BUSINESS' }),
      client => createClient(client, user1),
      taskEither.chain(
        foldClient({
          PRIVATE: () => taskEither.left(testError()),
          BUSINESS: client => taskEither.right(client)
        })
      ),
      pipeTestTaskEither(client => {
        expect(client.countryCode).not.toBe(null)
        expect(client.vatNumber).not.toBe(null)
        expect(client.businessName).not.toBe(null)
      }),
      taskEither.chain(({ _id }) =>
        pipe(
          getFakeClient(user1._id, { type: 'PRIVATE' }),
          client => updateClient(_id, client, user1),
          taskEither.chain(
            foldClient({
              PRIVATE: client => taskEither.right(client),
              BUSINESS: () => taskEither.left(testError())
            })
          )
        )
      ),
      testTaskEither(client => {
        expect(client.fiscalCode).not.toBe(null)
        expect(client.firstName).not.toBe(null)
        expect(client.lastName).not.toBe(null)
      })
    )
  })

  it('should switch from a PRIVATE to a BUSINESS client correctly', async () => {
    await pipe(
      getFakeClient(user1._id, { type: 'PRIVATE' }),
      client => createClient(client, user1),
      taskEither.chain(
        foldClient({
          PRIVATE: client => taskEither.right(client),
          BUSINESS: () => taskEither.left(testError())
        })
      ),
      pipeTestTaskEither(client => {
        expect(client.fiscalCode).not.toBe(null)
        expect(client.firstName).not.toBe(null)
        expect(client.lastName).not.toBe(null)
      }),
      taskEither.chain(({ _id }) =>
        pipe(
          getFakeClient(user1._id, { type: 'BUSINESS' }),
          client => updateClient(_id, client, user1),
          taskEither.chain(
            foldClient({
              PRIVATE: () => taskEither.left(testError()),
              BUSINESS: client => taskEither.right(client)
            })
          )
        )
      ),
      testTaskEither(client => {
        expect(client.countryCode).not.toBe(null)
        expect(client.vatNumber).not.toBe(null)
        expect(client.businessName).not.toBe(null)
      })
    )
  })
})

describe('deleteClient', () => {
  let client1: Client
  let client2: Client

  beforeAll(async () => {
    await pipe(
      createClient(getFakeClient(user1._id), user1),
      testTaskEither(client => {
        client1 = client
      })
    )

    await pipe(
      createClient(getFakeClient(user2._id), user2),
      testTaskEither(client => {
        client2 = client
      })
    )
  })

  it('should work', async () => {
    await pipe(
      deleteClient(client1._id, user1),
      testTaskEither(client => {
        expect(client).toMatchObject(client1)
      })
    )
  })

  it("should not allow users to delete other users' clients", async () => {
    await pipe(
      deleteClient(client2._id, user1),
      testTaskEitherError(error => {
        expect(error.code).toBe('COOLER_403')
      })
    )
  })
})
