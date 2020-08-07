import init from './init'
import { getDatabase } from '../misc/getDatabase'
import { Database } from 'sqlite'
import { insert, update } from '../misc/dbUtils'
import { getFakeClient } from '../test/getFakeClient'
import { Client } from './Client'
import SQL from 'sql-template-strings'

describe('initClient', () => {
  describe('happy path', () => {
    let db: Database

    beforeAll(async () => {
      db = await getDatabase()
      await init()
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM client')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('client', getFakeClient())
      const client = await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)

      expect(client!.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const client = getFakeClient()
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
  })
})
