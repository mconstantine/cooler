import { init } from '../init'
import { Database } from 'sqlite'
import { getDatabase } from '../misc/getDatabase'
import { getFakeUser } from '../test/getFakeUser'
import { insert, update } from '../misc/dbUtils'
import { User } from './interface'
import SQL from 'sql-template-strings'

describe('initTask', () => {
  describe('happy path', () => {
    let db: Database

    beforeAll(async () => {
      await init()
      db = await getDatabase()
    })

    it('should create a database table', async () => {
      await db.exec('SELECT * FROM user')
    })

    it('should save the creation time automatically', async () => {
      const { lastID } = await insert('user', getFakeUser())
      const user = await db.get<User>(SQL`SELECT * FROM user WHERE id = ${lastID}`)

      expect(user!.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const user = getFakeUser()
      const updated: Partial<User> = { name: 'Some weird name' }

      expect(user.name).not.toBe(updated.name)

      const { lastID } = await insert('user', user)

      const updateDateBefore = (
        await db.get<User>(SQL`SELECT * FROM user WHERE id = ${lastID}`)
      )!.updated_at

      await (() => new Promise(done => setTimeout(() => done(), 1000)))()
      await update('user', { id: lastID, ...updated })

      const updateDateAfter = (
        await db.get<User>(SQL`SELECT * FROM user WHERE id = ${lastID}`)
      )!.updated_at

      expect(updateDateBefore).not.toBe(updateDateAfter)
    })
  })
})
