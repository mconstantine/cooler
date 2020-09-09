import { init } from "./init"
import { insert } from "./misc/dbUtils"
import { getFakeUser } from "./test/getFakeUser"
import { getFakeClient } from "./test/getFakeClient"
import { getFakeProject } from "./test/getFakeProject"
import { getDatabase } from "./misc/getDatabase"
import { Project } from "./project/interface"
import SQL from "sql-template-strings"

describe('init', () => {
  beforeAll(async () => {
    await init()
  })

  describe('migrations', () => {
    describe('project-cashed-balance', () => {
      it('should work', async () => {
        const { lastID: user } = await insert('user', getFakeUser())
        const { lastID: client } = await insert('client', getFakeClient({ user }))
        const { lastID: projectId } = await insert('project', getFakeProject({ client }))

        const db = await getDatabase()
        const project = await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${projectId}`)

        expect(project?.cashed_balance).toBeDefined()
      })
    })
  })
})
