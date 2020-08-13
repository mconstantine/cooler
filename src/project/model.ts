import { Project } from './Project'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { User } from '../user/User'

export async function createProject(project: Partial<Project>) {
  const db = await getDatabase()
  const { lastID } = await insert('project', project)

  return await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${lastID}`)
}

export async function listProjects(args: ConnectionQueryArgs & { name?: string }, user: User) {
  const sql = SQL`
    JOIN client ON project.client = client.id
    WHERE client.user = ${user.id}
  `

  args.name && sql.append(SQL` AND project.name LIKE ${`%${args.name}%`}`)
  return await queryToConnection(args, ['project.*'], 'project', sql)
}

// TODO: make sure that the user can update the project
export async function updateProject(id: number, project: Partial<Project>) {
  const db = await getDatabase()
  const { name, description, client } = project

  if (name || description || client) {
    const args = Object.entries({ name, description, client }).filter(
      ([, value]) => !!value
    ).reduce(
      (res, [key, value]) => ({ ...res, [key]: value }), {}
    )

    await update('project', { ...args, id })
  }

  return await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${id}`)
}

// TODO: make sure that the user can delete the project
export async function deleteProject(id: number) {
  const db = await getDatabase()
  const project = await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${id}`)

  if (!project) {
    return null
  }

  await remove('project', { id })

  return project
}
