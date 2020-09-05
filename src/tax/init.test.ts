import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { init } from '../init'
import { insert, remove } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeTax } from '../test/getFakeTax'

describe('init taxes', () => {
  beforeAll(async () => {
    await init()
  })

  it('should create a database table', async () => {
    const db = await getDatabase()
    await db.all(SQL`SELECT * FROM tax`)
  })

  it('should delete taxes if a user is deleted', async () => {
    const db = await getDatabase()
    const { lastID: user } = await insert('user', getFakeUser())
    const { lastID: tax } = await insert('tax', getFakeTax({ user }))

    expect(await db.get(SQL`SELECT * FROM tax WHERE id = ${tax}`)).toBeDefined()

    await remove('user', { id: user })

    expect(await db.get(SQL`SELECT * FROM tax WHERE id = ${tax}`)).toBeUndefined()
  })
})
