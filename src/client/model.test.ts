import initUser from '../user/init'
import initClient from './init'
import { getFakeUser } from '../test/getFakeUser'
import { insert } from '../misc/dbUtils'
import { User } from '../user/User'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { getFakeClient } from '../test/getFakeClient'
import { createClient, listClients, updateClient, deleteClient, getClient } from './model'
import { Client } from './Client'
import { ApolloError } from 'apollo-server'

let user1: User
let user2: User
let client1: Client
let client2: Client

beforeAll(async () => {
  await initUser()
  await initClient()

  const db = await getDatabase()
  const user1Data = getFakeUser()
  const user2Data = getFakeUser()
  const user1Id = (await insert('user', user1Data)).lastID!
  const user2Id = (await insert('user', user2Data)).lastID!

  user1 = await db.get(SQL`SELECT * FROM user WHERE id = ${user1Id}`)!
  user2 = await db.get(SQL`SELECT * FROM user WHERE id = ${user2Id}`)!
  client1 = await createClient(getFakeClient(), user1) as Client
  client2 = await createClient(getFakeClient(), user2) as Client
})

describe('createClient', () => {
  it('should set the user automatically', async () => {
    const clientData = getFakeClient()
    const client = await createClient(clientData, user1)

    expect(clientData.user).toBeUndefined()
    expect(client?.user).toBe(user1.id)
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

    expect(
      results.edges.map(({ node }) => node)
    ).toContainEqual(
      expect.objectContaining({ id: client1.id })
    )

    expect(
      results.edges.map(({ node }) => node)
    ).not.toContainEqual(
      expect.objectContaining({ id: client2.id })
    )
  })
})

describe('updateClient', () => {
  it('should work', async () => {
    const data = getFakeClient()
    const result = await updateClient(client1.id, data, user1) as Client

    expect(result).toMatchObject(data)
    client1 = result
  })

  it("should not allow users to update other users' clients", async () => {
    await expect(async () => {
      await updateClient(client1.id, getFakeClient(), user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('deleteClient', () => {
  let client1: Client
  let client2: Client

  beforeAll(async () => {
    client1 = await createClient(getFakeClient(), user1) as Client
    client2 = await createClient(getFakeClient(), user2) as Client
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
