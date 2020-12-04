import {
  ApolloClient,
  ApolloError,
  gql,
  NormalizedCacheObject
} from '@apollo/client'
import { constVoid, identity, pipe } from 'fp-ts/function'
import {
  BusinessClientCreationInput,
  ClientCreationInput,
  foldClientCreationInput,
  PrivateClientCreationInput,
  Country,
  Province,
  PrivateClientData,
  BusinessClientData
} from '../client/interface'
import { getFakeUser } from '../test/getFakeUser'
import { registerUser } from '../test/registerUser'
import { pipeTestTaskEither, testTaskEither } from '../test/util'
import { User } from '../user/interface'
import { loginUser, mutate } from './graphQLUtils'
import { startServerAndGetClient, stopServer } from './setupTests'
import * as t from 'io-ts'
import { getFakeClient } from '../test/getFakeClient'
import { option, taskEither } from 'fp-ts'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import { clientFragment } from './fragments'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import { EmailString, PositiveInteger } from '../misc/Types'

const PopulatedClientData = t.type({
  id: PositiveInteger,
  address_country: Country,
  address_province: Province,
  address_city: NonEmptyString,
  address_zip: NonEmptyString,
  address_street: NonEmptyString,
  address_street_number: optionFromNullable(NonEmptyString),
  address_email: EmailString,
  user: User
})

const PrivateClientResponse = t.intersection([
  PopulatedClientData,
  PrivateClientData,
  t.type({
    name: NonEmptyString
  })
])
type PrivateClientResponse = t.TypeOf<typeof PrivateClientResponse>

const BusinessClientResponse = t.intersection([
  PopulatedClientData,
  BusinessClientData,
  t.type({
    name: NonEmptyString
  })
])
type BusinessClientResponse = t.TypeOf<typeof BusinessClientResponse>

describe('client resolvers', () => {
  let apolloClient: ApolloClient<NormalizedCacheObject>
  let user: User
  let accessToken: string

  beforeAll(async () => {
    const userInput = getFakeUser()

    apolloClient = await pipe(
      startServerAndGetClient(),
      testTaskEither(identity)
    )

    await pipe(
      registerUser(userInput),
      pipeTestTaskEither(u => {
        user = u
        return u
      }),
      testTaskEither(constVoid)
    )

    await pipe(
      loginUser(apolloClient, userInput.email, userInput.password),
      pipeTestTaskEither(response => {
        accessToken = response.accessToken
      }),
      testTaskEither(constVoid)
    )
  })

  afterAll(async () => {
    await pipe(stopServer(), testTaskEither(constVoid))
  })

  describe('createClient', () => {
    describe('private client', () => {
      it('should work', async () => {
        const data = getFakeClient(user.id, {
          type: 'PRIVATE'
        })

        await pipe(createClient(data), testTaskEither(constVoid))
      })
    })

    describe('business client', () => {
      it('should work', async () => {
        const data = getFakeClient(user.id, {
          type: 'BUSINESS'
        })

        await pipe(createClient(data), testTaskEither(constVoid))
      })
    })
  })

  describe('updateClient', () => {
    describe('private to business', () => {
      it('should work', async () => {
        const data = getFakeClient(user.id, {
          type: 'PRIVATE'
        })

        const update = getFakeClient(user.id, {
          type: 'BUSINESS'
        })

        await pipe(
          createClient(data),
          taskEither.chain(client =>
            mutate(
              t.type({
                updateClient: BusinessClientResponse
              }),
              apolloClient,
              gql`
                ${clientFragment}

                mutation {
                  updateClient(
                    id: ${client.id},
                    client: ${getBusinessClientDocumentNodeInput(update)}
                  ) {
                    ...Client
                  }
                }
              `,
              accessToken
            )
          ),
          testTaskEither(({ updateClient }) => {
            expect(updateClient.type).toBe('BUSINESS')
            expect(Country.is(updateClient.country_code)).toBe(true)
            expect(NonEmptyString.is(updateClient.vat_number)).toBe(true)
            expect(NonEmptyString.is(updateClient.business_name)).toBe(true)
            // @ts-ignore
            expect(updateClient.fiscal_code).toBeNull()
            // @ts-ignore
            expect(updateClient.first_name).toBeNull()
            // @ts-ignore
            expect(updateClient.last_name).toBeNull()
          })
        )
      })
    })

    describe('business to private', () => {
      it('should work', async () => {
        const data = getFakeClient(user.id, {
          type: 'BUSINESS'
        })

        const update = getFakeClient(user.id, {
          type: 'PRIVATE'
        })

        await pipe(
          createClient(data),
          taskEither.chain(client =>
            mutate(
              t.type({
                updateClient: PrivateClientResponse
              }),
              apolloClient,
              gql`
                ${clientFragment}

                mutation {
                  updateClient(
                    id: ${client.id},
                    client: ${getPrivateClientDocumentNodeInput(update)}
                  ) {
                    ...Client
                  }
                }
              `,
              accessToken
            )
          ),
          testTaskEither(({ updateClient }) => {
            expect(updateClient.type).toBe('PRIVATE')
            expect(NonEmptyString.is(updateClient.fiscal_code)).toBe(true)
            expect(NonEmptyString.is(updateClient.first_name)).toBe(true)
            expect(NonEmptyString.is(updateClient.last_name)).toBe(true)
            // @ts-ignore
            expect(updateClient.country_code).toBeNull()
            // @ts-ignore
            expect(updateClient.vat_number).toBeNull()
            // @ts-ignore
            expect(updateClient.business_name).toBeNull()
          })
        )
      })
    })
  })

  function createClient(
    client: PrivateClientCreationInput
  ): TaskEither<ApolloError, PrivateClientResponse>
  function createClient(
    client: BusinessClientCreationInput
  ): TaskEither<ApolloError, BusinessClientResponse>
  function createClient(
    client: ClientCreationInput
  ): TaskEither<ApolloError, any> {
    const input = pipe(
      client,
      foldClientCreationInput(
        getPrivateClientDocumentNodeInput,
        getBusinessClientDocumentNodeInput
      )
    )

    return pipe(
      mutate(
        t.type({
          createClient: pipe(
            client,
            foldClientCreationInput(
              () => PrivateClientResponse,
              // @ts-ignore
              () => BusinessClientResponse
            )
          )
        }),
        apolloClient,
        gql`
          ${clientFragment}

          mutation {
            createClient(client: ${input}) {
              ...Client
            }
          }
        `,
        accessToken
      ),
      taskEither.map(({ createClient }) => createClient)
    )
  }
})

function getPrivateClientDocumentNodeInput(
  client: PrivateClientCreationInput
): string {
  return `{
    type: PRIVATE
    fiscal_code: "${client.fiscal_code}"
    first_name: "${client.first_name}"
    last_name: "${client.last_name}"
    address_country: "${client.address_country}"
    address_province: "${client.address_province}"
    address_city: "${client.address_city}"
    address_zip: "${client.address_zip}"
    address_street: "${client.address_street}"
    address_street_number: "${option.toNullable(client.address_street_number)}"
    address_email: "${client.address_email}"
  }`
}

function getBusinessClientDocumentNodeInput(
  client: BusinessClientCreationInput
): string {
  return `{
    type: BUSINESS
    country_code: "${client.country_code}"
    vat_number: "${client.vat_number}"
    business_name: "${client.business_name}"
    address_country: "${client.address_country}"
    address_province: "${client.address_province}"
    address_city: "${client.address_city}"
    address_zip: "${client.address_zip}"
    address_street: "${client.address_street}"
    address_street_number: "${option.toNullable(client.address_street_number)}"
    address_email: "${client.address_email}"
  }`
}
