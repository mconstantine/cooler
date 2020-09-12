import { init } from '../init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update, remove } from '../misc/dbUtils'
import { getFakeClient } from '../test/getFakeClient'
import { Client, ClientType } from './interface'
import SQL from 'sql-template-strings'
import { User } from '../user/interface'
import { getFakeUser } from '../test/getFakeUser'

describe('initClient', () => {
  describe('happy path', () => {
    let db: Database
    let user: User

    beforeAll(async () => {
      db = await getDatabase()

      await init()

      const userData = getFakeUser()
      const { lastID } = await insert('user', userData)

      user = { ...userData, id: lastID! } as User
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM client')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('client', getFakeClient(user.id))
      const client = await db.get<Client>(
        SQL`SELECT * FROM client WHERE id = ${lastID}`
      )

      expect(client!.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      )
    })

    it('should keep track of the time of the last update', async () => {
      const client = getFakeClient(user.id)
      const updated: Partial<Client> = { address_city: 'Some weird city' }

      expect(client.address_city).not.toBe(updated.address_city)

      const { lastID } = await insert('client', client)

      const updateDateBefore = (await db.get<Client>(
        SQL`SELECT * FROM client WHERE id = ${lastID}`
      ))!.updated_at

      await (() => new Promise(done => setTimeout(() => done(), 1000)))()
      await update('client', { id: lastID, ...updated })

      const updateDateAfter = (await db.get<Client>(
        SQL`SELECT * FROM client WHERE id = ${lastID}`
      ))!.updated_at

      expect(updateDateBefore).not.toBe(updateDateAfter)
    })

    it("should delete all user's clients when the user is deleted", async () => {
      const userData = getFakeUser()
      const { lastID: userId } = await insert('user', userData)
      const clientData = getFakeClient(userId!)
      const { lastID: clientId } = await insert('client', clientData)

      await remove('user', { id: userId })

      const client = await db.get<Client>(
        SQL`SELECT * FROM client WHERE id = ${clientId}`
      )

      expect(client).toBeUndefined()
    })
  })

  describe('validation', () => {
    it('should check that fiscal_code exists for PRIVATE Clients', async () => {
      const client = getFakeClient(0, { type: ClientType.PRIVATE })
      client.fiscal_code = null
      await expect(insert('client', client)).rejects.toBeDefined()
    })

    it('should check that first_name exists for PRIVATE Clients', async () => {
      const client = getFakeClient(0, { type: ClientType.PRIVATE })
      client.first_name = null
      await expect(insert('client', client)).rejects.toBeDefined()
    })

    it('should check that last_name exists for PRIVATE Clients', async () => {
      const client = getFakeClient(0, { type: ClientType.PRIVATE })
      client.last_name = null
      await expect(insert('client', client)).rejects.toBeDefined()
    })

    it('should check that country_code exists for BUSINESS Clients', async () => {
      const client = getFakeClient(0, { type: ClientType.BUSINESS })
      client.country_code = null
      await expect(insert('client', client)).rejects.toBeDefined()
    })

    it('should check that vat_number exists for BUSINESS Clients', async () => {
      const client = getFakeClient(0, { type: ClientType.BUSINESS })
      client.vat_number = null
      await expect(insert('client', client)).rejects.toBeDefined()
    })

    it('should check that business_name exists for BUSINESS Clients', async () => {
      const client = getFakeClient(0, { type: ClientType.BUSINESS })
      client.business_name = null
      await expect(insert('client', client)).rejects.toBeDefined()
    })
  })
})
