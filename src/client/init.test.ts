import { init } from '../init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update, remove } from '../misc/dbUtils'
import { getFakeClient } from '../test/getFakeClient'
import { Client, ClientFromDatabase, ClientType } from './interface'
import SQL from 'sql-template-strings'
import { User, UserCreationInput } from '../user/interface'
import { getFakeUser } from '../test/getFakeUser'
import { definitely } from '../misc/definitely'
import { sleep } from '../test/sleep'

describe('initClient', () => {
  describe('happy path', () => {
    let db: Database
    let user: UserCreationInput & Pick<User, 'id'>

    beforeAll(async () => {
      db = await getDatabase()

      await init()

      const userData = getFakeUser()

      const lastID = definitely(
        (await insert<UserCreationInput>('user', userData)).lastID
      )

      user = { ...userData, id: lastID }
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM client')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('client', getFakeClient(user.id))

      const client = definitely(
        await db.get<ClientFromDatabase>(
          SQL`SELECT * FROM client WHERE id = ${lastID}`
        )
      )

      expect(client.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const client = getFakeClient(user.id)
      const updated = { address_city: 'Some weird city' }

      expect(client.address_city).not.toBe(updated.address_city)

      const { lastID } = await insert('client', client)

      const updateDateBefore = definitely(
        await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)
      ).updated_at

      await sleep(1000)
      await update('client', { id: lastID, ...updated })

      const updateDateAfter = definitely(
        await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)
      ).updated_at

      expect(updateDateBefore).not.toBe(updateDateAfter)
    })

    it("should delete all user's clients when the user is deleted", async () => {
      const userData = getFakeUser()
      const userId = definitely((await insert('user', userData)).lastID)
      const clientData = getFakeClient(userId)
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
