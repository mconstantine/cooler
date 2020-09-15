import { init } from '../init'
import { Database } from 'sqlite'
import { getDatabase } from '../misc/getDatabase'
import { getFakeUser } from '../test/getFakeUser'
import { update } from '../misc/dbUtils'
import { User } from './interface'
import SQL from 'sql-template-strings'
import { getID } from '../test/getID'
import { definitely } from '../misc/definitely'
import { sleep } from '../test/sleep'

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
      const lastID = await getID('user', getFakeUser())

      const user = definitely(
        await db.get<User>(SQL`SELECT * FROM user WHERE id = ${lastID}`)
      )

      expect(user.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('should keep track of the time of the last update', async () => {
      const user = getFakeUser()
      const updated = { name: 'Some weird name' }

      expect(user.name).not.toBe(updated.name)

      const lastID = await getID('user', user)

      const updateDateBefore = definitely(
        await db.get<User>(SQL`SELECT * FROM user WHERE id = ${lastID}`)
      ).updated_at

      await sleep(1000)
      await update('user', { id: lastID, ...updated })

      const updateDateAfter = definitely(
        await db.get<User>(SQL`SELECT * FROM user WHERE id = ${lastID}`)
      ).updated_at

      expect(updateDateBefore).not.toBe(updateDateAfter)
    })
  })
})
