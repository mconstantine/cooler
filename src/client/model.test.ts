import { getFakeUser } from '../test/getFakeUser'
import { insert } from '../misc/dbUtils'
import { User } from '../user/interface'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { getFakeClient } from '../test/getFakeClient'
import {
  createClient,
  listClients,
  updateClient,
  deleteClient,
  getClient
} from './model'
import { Client, ClientType } from './interface'
import { ApolloError } from 'apollo-server-express'
import { init } from '../init'
import { definitely } from '../misc/definitely'
import { getConnectionNodes } from '../test/getConnectionNodes'

let user1: User
let user2: User
let client1: Client
let client2: Client

beforeAll(async () => {
  await init()

  const db = await getDatabase()
  const user1Data = getFakeUser()
  const user2Data = getFakeUser()
  const user1Id = definitely((await insert('user', user1Data)).lastID)
  const user2Id = definitely((await insert('user', user2Data)).lastID)

  user1 = definitely(
    await db.get(SQL`SELECT * FROM user WHERE id = ${user1Id}`)
  )
  user2 = definitely(
    await db.get(SQL`SELECT * FROM user WHERE id = ${user2Id}`)
  )

  client1 = definitely(await createClient(getFakeClient(user1.id), user1))
  client2 = definitely(await createClient(getFakeClient(user2.id), user2))
})

describe('createClient', () => {
  it('should set the user automatically', async () => {
    const clientData = getFakeClient(0)
    const client = definitely(await createClient(clientData, user1))

    expect(clientData.user).toBe(0)
    expect(client.user).toBe(user1.id)
  })
})

describe('getClient', () => {
  it('should work', async () => {
    expect(await getClient(client1.id, user1)).toMatchObject(client1)
  })

  it("should not allow users to see other users' clients", async () => {
    await expect(async () => {
      await getClient(client2.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('listClients', () => {
  it("should list only the user's clients", async () => {
    const results = await listClients({}, user1)

    expect(getConnectionNodes(results)).toContainEqual(
      expect.objectContaining({ id: client1.id })
    )

    expect(getConnectionNodes(results)).not.toContainEqual(
      expect.objectContaining({ id: client2.id })
    )
  })
})

describe('updateClient', () => {
  it('should work', async () => {
    const data = getFakeClient(user1.id)
    const result = definitely(await updateClient(client1.id, data, user1))

    expect(result).toMatchObject(data)
    client1 = result
  })

  it("should not allow users to update other users' clients", async () => {
    await expect(async () => {
      await updateClient(client1.id, getFakeClient(user2.id), user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it('should switch from a BUSINESS to a PRIVATE client correctly', async () => {
    const client = definitely(
      await createClient(
        getFakeClient(user1.id, { type: ClientType.BUSINESS }),
        user1
      )
    )

    expect(client.fiscal_code).toBe(null)
    expect(client.first_name).toBe(null)
    expect(client.last_name).toBe(null)
    expect(client.country_code).not.toBe(null)
    expect(client.vat_number).not.toBe(null)
    expect(client.business_name).not.toBe(null)

    const updatedClient = definitely(
      await updateClient(
        client.id,
        getFakeClient(user1.id, { type: ClientType.PRIVATE }),
        user1
      )
    )

    expect(updatedClient.country_code).toBe(null)
    expect(updatedClient.vat_number).toBe(null)
    expect(updatedClient.business_name).toBe(null)
    expect(updatedClient.fiscal_code).not.toBe(null)
    expect(updatedClient.first_name).not.toBe(null)
    expect(updatedClient.last_name).not.toBe(null)
  })

  it('should switch from a PRIVATE to a BUSINESS client correctly', async () => {
    const client = definitely(
      await createClient(
        getFakeClient(user1.id, { type: ClientType.PRIVATE }),
        user1
      )
    )

    expect(client.country_code).toBe(null)
    expect(client.vat_number).toBe(null)
    expect(client.business_name).toBe(null)
    expect(client.fiscal_code).not.toBe(null)
    expect(client.first_name).not.toBe(null)
    expect(client.last_name).not.toBe(null)

    const updatedClient = definitely(
      await updateClient(
        client.id,
        getFakeClient(user1.id, { type: ClientType.BUSINESS }),
        user1
      )
    )

    expect(updatedClient.fiscal_code).toBe(null)
    expect(updatedClient.first_name).toBe(null)
    expect(updatedClient.last_name).toBe(null)
    expect(updatedClient.country_code).not.toBe(null)
    expect(updatedClient.vat_number).not.toBe(null)
    expect(updatedClient.business_name).not.toBe(null)
  })
})

describe('deleteClient', () => {
  let client1: Client
  let client2: Client

  beforeAll(async () => {
    client1 = definitely(await createClient(getFakeClient(user1.id), user1))
    client2 = definitely(await createClient(getFakeClient(user2.id), user2))
  })

  it('should work', async () => {
    expect(await deleteClient(client1.id, user1)).toMatchObject(client1)
  })

  it("should not allow users to delete other users' clients", async () => {
    await expect(async () => {
      await deleteClient(client2.id, user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})
