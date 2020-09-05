import { init } from '../init'
import { User } from '../user/User'
import { insert } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { getFakeTax } from '../test/getFakeTax'
import { createTax, getTax, listTaxes, updateTax, deleteTax } from './model'
import { ApolloError } from 'apollo-server-express'
import { Tax } from './Tax'

let user1: User
let user2: User
let tax1: Tax
let tax2: Tax

beforeAll(async () => {
  await init()

  const db = await getDatabase()
  const { lastID: user1Id } = await insert('user', getFakeUser())
  const { lastID: user2Id } = await insert('user', getFakeUser())
  const { lastID: tax1Id } = await insert('tax', getFakeTax({ user: user1Id }))
  const { lastID: tax2Id } = await insert('tax', getFakeTax({ user: user2Id }))

  user1 = (await db.get<User>(SQL`SELECT * FROM user WHERE id = ${user1Id}`))!
  user2 = (await db.get<User>(SQL`SELECT * FROM user WHERE id = ${user2Id}`))!
  tax1 = (await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${tax1Id}`))!
  tax2 = (await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${tax2Id}`))!
})

describe('createTax', () => {
  it('should work', async () => {
    const taxData = getFakeTax({ user: user1.id })
    const res = await createTax(taxData, user1)

    expect(res).toMatchObject(taxData)
  })

  it('should use the user from the request by default', async () => {
    const res = await createTax(getFakeTax({ user: user2.id }), user1)
    expect(res?.user).toBe(user1.id)
  })

  it('should not allow values below zero', async () => {
    await expect(async () => {
      await createTax(getFakeTax({ value: -1 }), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it('should not allow values above one', async () => {
    await expect(async () => {
      await createTax(getFakeTax({ value: 1.1 }), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('getTax', () => {
  it('should work', async () => {
    expect(await getTax(tax1.id, user1)).toMatchObject(tax1)
  })

  it('should not allow users to see taxes of other users', async () => {
    await expect(async () => {
      await getTax(tax1.id, user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('listTaxes', () => {
  it("should list all and only the user's taxes", async () => {
    const taxes = await listTaxes({}, user1)

    expect(taxes.edges.map(({ node }) => node)).toContainEqual(tax1)
    expect(taxes.edges.map(({ node }) => node)).not.toContainEqual(tax2)
  })
})

describe('updateTax', () => {
  it('should work', async () => {
    const data = getFakeTax()
    const tax = await updateTax(tax2.id, data, user2)

    expect(tax?.label).toEqual(data.label)

    tax2 = tax as Tax
  })

  it('should not allow users to update taxes of other users', async () => {
    await expect(async () => {
      await updateTax(tax1.id, getFakeTax(), user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it('should not allow users to update users of taxes', async () => {
    await expect(async () => {
      await updateTax(tax1.id, getFakeTax({ user: user2.id }), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it('should not allow values below zero', async () => {
    await expect(async () => {
      await updateTax(tax1.id, getFakeTax({ value: -1 }), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })

  it('should not allow values above one', async () => {
    await expect(async () => {
      await updateTax(tax1.id, getFakeTax({ value: 1.1 }), user1)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})

describe('deleteTax', () => {
  it('should work', async () => {
    const db = await getDatabase()
    const data = getFakeTax({ user: user1.id })
    const { lastID } = await insert('tax', data)

    const tax = await deleteTax(lastID!, user1)

    expect(tax).toMatchObject(data)
    expect(await db.get(SQL`SELECT * FROM tax WHERE id = ${lastID}`)).toBeUndefined()
  })

  it('should not allow users to delete taxes of other users', async () => {
    const { lastID } = await insert('tax', getFakeTax({ user: user1.id }))

    await expect(async () => {
      await deleteTax(lastID!, user2)
    }).rejects.toBeInstanceOf(ApolloError)
  })
})
