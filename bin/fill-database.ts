import dotenv from 'dotenv'
import { init } from '../src/init'
import { getDatabase } from '../src/misc/getDatabase'
import { createUser } from '../src/user/model'
import { verify } from 'jsonwebtoken'
import SQL from 'sql-template-strings'
import { getFakeProject } from '../src/test/getFakeProject'
import { getFakeClient } from '../src/test/getFakeClient'
import { getFakeTask } from '../src/test/getFakeTask'
import { getFakeSessionFromDatabase } from '../src/test/getFakeSession'
import { fromSQLDate, toSQLDate, insert } from '../src/misc/dbUtils'
import { getFakeTax } from '../src/test/getFakeTax'
import { Token, UserFromDatabase } from '../src/user/interface'
import { Tax } from '../src/tax/interface'
import { ProjectFromDatabase } from '../src/project/interface'
import { TaskFromDatabase } from '../src/task/interface'
import { toDatabase as taskToDatabase } from '../src/task/model'
import { SessionFromDatabase } from '../src/session/interface'
;(async () => {
  const USERS_COUNT = 2
  const CLIENTS_PER_USER = 20
  const PROJECTS_PER_CLIENT = 3
  const TASKS_PER_PROJECT = 10
  const SESSIONS_PER_TASK = 10

  const totalProgress =
    USERS_COUNT *
    CLIENTS_PER_USER *
    PROJECTS_PER_CLIENT *
    TASKS_PER_PROJECT *
    SESSIONS_PER_TASK

  console.log(`Will create ${totalProgress} entities. This could take a while.`)
  dotenv.config()

  const db = await getDatabase()

  await init()
  await db.exec(`DELETE FROM user`)

  const { accessToken } = (await createUser(
    {
      name: 'Mauro Constantinescu',
      email: 'mauro.constantinescu@gmail.com',
      password: 'password'
    },
    {}
  ))!

  const token = verify(accessToken, process.env.SECRET!) as Token
  const user = await db.get<UserFromDatabase>(
    SQL`SELECT * FROM user WHERE id = ${token.id}`
  )

  await createUser(
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password'
    },
    { user }
  )

  const users = await db.all<UserFromDatabase[]>('SELECT * FROM user')

  for (let u = 0; u < users.length; u++) {
    const user = users[u]

    for (let t = 0; t < 3; t++) {
      await insert<Partial<Tax>>('tax', getFakeTax(user.id))
    }

    const clients: number[] = []

    for (let c = 0; c < CLIENTS_PER_USER; c++) {
      const { lastID } = await insert('client', getFakeClient(user.id))
      clients.push(lastID!)
    }

    for (let c = 0; c < clients.length; c++) {
      const client = clients[c]
      const projects: number[] = []

      for (let p = 0; p < PROJECTS_PER_CLIENT; p++) {
        const { lastID } = await insert<Partial<ProjectFromDatabase>>(
          'project',
          getFakeProject(client)
        )

        projects.push(lastID!)
      }

      for (let p = 0; p < projects.length; p++) {
        const project = projects[p]
        const tasks: number[] = []
        const startTime: Date[] = []
        const expectedWorkingHours: number[] = []

        for (let t = 0; t < TASKS_PER_PROJECT; t++) {
          const task = getFakeTask(project)

          const { lastID } = await insert<Partial<TaskFromDatabase>>(
            'task',
            taskToDatabase(task)
          )

          expectedWorkingHours.push(task.expectedWorkingHours!)
          startTime.push(task.start_time)
          tasks.push(lastID!)
        }

        for (let t = 0; t < tasks.length; t++) {
          const task = tasks[t]
          const ewh = expectedWorkingHours[t] / SESSIONS_PER_TASK
          const st = startTime[t]
          const sessions: number[] = []

          for (let s = 0; s < SESSIONS_PER_TASK; s++) {
            const session = getFakeSessionFromDatabase(task, {
              start_time: toSQLDate(
                new Date(
                  st.getTime() + 1000 + Math.round(Math.random() * 86400000)
                )
              )
            })

            // 20% to 120%
            const workingHours = ewh * 0.2 + Math.random() * ewh * 1

            session.end_time = toSQLDate(
              new Date(
                fromSQLDate(session.start_time).getTime() +
                  3600000 * workingHours
              )
            )

            const { lastID } = await insert<Partial<SessionFromDatabase>>(
              'session',
              session
            )

            sessions.push(lastID!)

            const currentProgress =
              u *
                CLIENTS_PER_USER *
                PROJECTS_PER_CLIENT *
                TASKS_PER_PROJECT *
                SESSIONS_PER_TASK +
              c * PROJECTS_PER_CLIENT * TASKS_PER_PROJECT * SESSIONS_PER_TASK +
              p * TASKS_PER_PROJECT * SESSIONS_PER_TASK +
              t * SESSIONS_PER_TASK +
              s

            process.stdout.clearLine(0)
            process.stdout.cursorTo(0)
            process.stdout.write(
              `Working...${Math.round(
                (currentProgress / totalProgress) * 100
              )}%`
            )
          }
        }
      }
    }
  }
})()
  .then(() => process.exit())
  .catch(e => {
    console.log(e)
    process.exit()
  })
