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
import { Task } from '../src/task/Task'
import { getFakeSession } from '../src/test/getFakeSession'
import { fromSQLDate, toSQLDate } from '../src/misc/dbUtils'
import { createSession } from '../src/session/model'

(async () => {
  dotenv.config()

  const db = await getDatabase()

  await initUser()
  await initClient()
  await initProject()
  await initTask()

  await db.exec(`DELETE FROM user`)

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
    const clients: Client[] = []

    for (let i = 0; i < 20; i++) {
      const client = await createClient({ ...getFakeClient() }, user)
      clients.push(client!)
    }

    for (const client of clients) {
      const projects: Project[] = []

      for (let i = 0; i < 3; i++) {
        const project = await createProject(getFakeProject({
          client: client.id
        }), user)

        projects.push(project!)
      }

      for (const project of projects) {
        const tasks: Task[] = []

        for (let i = 0; i < 10; i++) {
          const task = await createTask(getFakeTask({
            project: project.id
          })!, user)

          tasks.push(task!)

          for (const task of tasks) {
            const session = getFakeSession()
            const startTime = fromSQLDate(session.start_time!)
            const expectedWorkingHours = task.expectedWorkingHours

            // 20% to 120%
            const workingHours = expectedWorkingHours * 0.2 + Math.random() * expectedWorkingHours * 1
            session.end_time = toSQLDate(new Date(startTime.getTime() + 3600000 * workingHours))

            for (let i = 0; i < 10; i++) {
              await createSession(session, user)
            }
          }
        }
      }
    }
  }
})()
.then(() => process.exit())
.catch(e => { console.log(e); process.exit() })
