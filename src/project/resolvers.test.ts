import { init } from '../init'
import { insert, toSQLDate } from '../misc/dbUtils'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeClient } from '../test/getFakeClient'
import { getFakeProject } from '../test/getFakeProject'
import resolvers from './resolvers'
import { getDatabase } from '../misc/getDatabase'
import { UserFromDatabase } from '../user/interface'
import SQL from 'sql-template-strings'
import { definitely } from '../misc/definitely'

describe('project resolvers', () => {
  beforeAll(async () => {
    await init()
  })

  describe('User', () => {
    describe('cashedBalance', () => {
      it('should work', async () => {
        const userId = definitely((await insert('user', getFakeUser())).lastID)

        const clientId = definitely(
          (await insert('client', getFakeClient(userId))).lastID
        )

        await insert(
          'project',
          getFakeProject(clientId, {
            cashed_at: toSQLDate(new Date()),
            cashed_balance: 15
          })
        )

        await insert(
          'project',
          getFakeProject(clientId, {
            cashed_at: toSQLDate(new Date()),
            cashed_balance: 25
          })
        )

        const db = await getDatabase()

        const userFromDatabase = definitely(
          await db.get<UserFromDatabase>(
            SQL`SELECT * FROM user WHERE id = ${userId}`
          )
        )

        const cashedBalance = await resolvers.User.cashedBalance(
          userFromDatabase,
          {},
          {},
          null as any
        )

        expect(cashedBalance).toBe(40)
      })
    })
  })
})
