import dotenv from 'dotenv'
import initUser from '../src/user/init'
import initClient from '../src/client/init'
import initProject from '../src/project/init'
import initTask from '../src/task/init'
import { getDatabase } from '../src/misc/getDatabase'
import { createUser } from '../src/user/model'
import { verify } from 'jsonwebtoken'
import { Token, User } from '../src/user/User'
import SQL from 'sql-template-strings'
import { createProject } from '../src/project/model'
import { getFakeProject } from '../src/test/getFakeProject'
import { createClient } from '../src/client/model'
import { getFakeClient } from '../src/test/getFakeClient'
import { Client } from '../src/client/Client'
import { Project } from '../src/project/Project'
import { createTask } from '../src/task/model'
import { getFakeTask } from '../src/test/getFakeTask'

(async () => {
  dotenv.config()

  const db = await getDatabase()
  await db.exec(`DELETE FROM user`)

  await initUser()
  await initClient()
  await initProject()
  await initTask()

  const { accessToken } = await createUser({
    name: 'Mauro Constantinescu',
    email: 'mauro.constantinescu@gmail.com',
    password: 'password'
  }, { user: null })

  const token = verify(accessToken, process.env.SECRET!) as Token
  const user = await db.get(SQL`SELECT * FROM user WHERE id = ${token.id}`) as User

  await createUser({
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password'
  }, { user })

  const users = await db.all<User[]>('SELECT * FROM user')

  for (const user of users) {
    for (let i = 0; i < 20; i++) {
      await createClient(getFakeClient(), { user })
    }
  }

  const clients = await db.all<Client[]>('SELECT * FROM client')

  for (const client of clients) {
    for (let i = 0; i < 3; i++) {
      await createProject(getFakeProject({
        client: client.id
      }))
    }
  }

  const projects = await db.all<Project[]>('SELECT * FROM project')

  for (const project of projects) {
    for (let i = 0; i < 10; i++) {
      await createTask(getFakeTask({
        project: project.id
      }))
    }
  }
})()
.then(() => process.exit())
.catch(e => { console.log(e); process.exit() })
