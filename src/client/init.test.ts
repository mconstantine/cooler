import init from './init'
import initUser from '../user/init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update, remove } from '../misc/dbUtils'
import { getFakeClient } from '../test/getFakeClient'
import { Client } from './Client'
import SQL from 'sql-template-strings'
import { User } from '../user/User'
import { getFakeUser } from '../test/getFakeUser'

describe('initClient', () => {
  describe('happy path', () => {
    let db: Database
    let user: User

    beforeAll(async () => {
      db = await getDatabase()

      await initUser()
      await init()

      const userData = getFakeUser()
      const { lastID } = await insert('user', userData)

      user = { ...userData, id: lastID! } as User
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM client')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('client', getFakeClient({ user: user.id }))
      const client = await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)

      expect(client!.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const client = getFakeClient({ user: user.id })
      const updated: Partial<Client> = { name: 'Some weird name' }

      expect(client.name).not.toBe(updated.name)

      const { lastID } = await insert('client', client)

      const updateDateBefore = (
        await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)
      )!.updated_at

      await (() => new Promise(done => setTimeout(() => done(), 1000)))()
      await update('client', { id: lastID, ...updated })

      const updateDateAfter = (
        await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)
      )!.updated_at

      expect(updateDateBefore).not.toBe(updateDateAfter)
    })

    it("should delete all user's clients when the user is deleted", async () => {
      const userData = getFakeUser()
      const { lastID: userId } = await insert('user', userData)
      const clientData = getFakeClient({ user: userId })
      const { lastID: clientId } = await insert('client', clientData)

      await remove('user', { id: userId })

      const client = await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${clientId}`)

      expect(client).toBeUndefined()
    })
  })
})
