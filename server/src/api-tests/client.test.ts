import axios, { AxiosError } from 'axios'
import { taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import {
  Client,
  ClientCreationInput,
  ClientUpdateInput,
  Country
} from '../client/interface'
import { CoolerError } from '../misc/Types'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeUser } from '../test/getFakeUser'
import { registerUser } from '../test/registerUser'
import { pipeTestTaskEither, testTaskEither } from '../test/util'
import { User } from '../user/interface'
import { setupTests } from './setupTests'
import { API_URL, loginUser, testRequest } from './utils'

describe('client resolvers', () => {
  let stopServer: TaskEither<Error, void>
  let user: User
  let accessToken: string

  beforeAll(async () => {
    const userInput = getFakeUser()

    stopServer = await setupTests()

    await pipe(
      registerUser(userInput),
      pipeTestTaskEither(u => {
        user = u
        return u
      }),
      testTaskEither(constVoid)
    )

    await pipe(
      loginUser(userInput.email, userInput.password),
      pipeTestTaskEither(response => {
        accessToken = response.accessToken
      }),
      testTaskEither(constVoid)
    )
  })

  afterAll(async () => {
    await pipe(stopServer, testTaskEither(constVoid))
  })

  describe('createClient', () => {
    describe('private client', () => {
      it('should work', async () => {
        const data = ClientCreationInput.encode(
          getFakeClient(user.id, {
            type: 'PRIVATE'
          })
        )

        await pipe(
          axios.post(`${API_URL}/clients`, data, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }),
          testRequest(Client),
          testTaskEither(constVoid)
        )
      })
    })

    describe('business client', () => {
      it('should work', async () => {
        const data = ClientCreationInput.encode(
          getFakeClient(user.id, {
            type: 'BUSINESS'
          })
        )

        await pipe(
          axios.post(`${API_URL}/clients`, data, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }),
          testRequest(Client),
          testTaskEither(constVoid)
        )
      })
    })
  })

  describe('updateClient', () => {
    describe('private to business', () => {
      it('should work', async () => {
        const data = getFakeClient(user.id, {
          type: 'PRIVATE'
        })

        const update = ClientUpdateInput.encode(
          getFakeClient(user.id, {
            type: 'BUSINESS'
          })
        )

        await pipe(
          createClient(data),
          taskEither.chain(client =>
            pipe(
              axios.put(`${API_URL}/clients/${client.id}/`, update, {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              }),
              testRequest(Client)
            )
          ),
          testTaskEither(client => {
            expect(client.type).toBe('BUSINESS')
            // @ts-ignore
            expect(Country.is(client.country_code)).toBe(true)
            // @ts-ignore
            expect(NonEmptyString.is(client.vat_number)).toBe(true)
            // @ts-ignore
            expect(NonEmptyString.is(client.business_name)).toBe(true)
            // @ts-ignore
            expect(client.fiscal_code).toBeNull()
            // @ts-ignore
            expect(client.first_name).toBeNull()
            // @ts-ignore
            expect(client.last_name).toBeNull()
          })
        )
      })
    })

    describe('business to private', () => {
      it('should work', async () => {
        const data = getFakeClient(user.id, {
          type: 'BUSINESS'
        })

        const update = ClientUpdateInput.encode(
          getFakeClient(user.id, {
            type: 'PRIVATE'
          })
        )

        await pipe(
          createClient(data),
          taskEither.chain(client =>
            pipe(
              axios.put(`${API_URL}/clients/${client.id}/`, update, {
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              }),
              testRequest(Client)
            )
          ),
          testTaskEither(client => {
            expect(client.type).toBe('PRIVATE')
            // @ts-ignore
            expect(NonEmptyString.is(client.fiscal_code)).toBe(true)
            // @ts-ignore
            expect(NonEmptyString.is(client.first_name)).toBe(true)
            // @ts-ignore
            expect(NonEmptyString.is(client.last_name)).toBe(true)
            // @ts-ignore
            expect(client.country_code).toBeNull()
            // @ts-ignore
            expect(client.vat_number).toBeNull()
            // @ts-ignore
            expect(client.business_name).toBeNull()
          })
        )
      })
    })
  })

  function createClient(
    data: ClientCreationInput
  ): TaskEither<AxiosError<CoolerError>, Client> {
    return pipe(
      axios.post(`${API_URL}/clients`, ClientCreationInput.encode(data), {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }),
      testRequest(Client)
    )
  }
})
