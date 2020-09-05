import initUser from './user/init'
import initClient from './client/init'
import initProject from './project/init'
import initTask from './task/init'
import initSession from './session/init'
import { getDatabase } from './misc/getDatabase'

export async function init() {
  await initUser()
  await initClient()
  await initProject()
  await initTask()
  await initSession()

  const db = await getDatabase()
  await db.migrate()
}
