import { Project } from './Project'
import { getDatabase } from '../misc/getDatabase'
import { insert } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'

export async function createProject(project: Partial<Project>) {
  const db = await getDatabase()
  const { lastID } = await insert('project', project)

  return await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${lastID}`)
}

export async function listProjects(args: ConnectionQueryArgs & { name?: string }) {
  return await queryToConnection(
    args, ['*'], 'project', args.name ? SQL`WHERE name LIKE ${`%${args.name}%`}` : undefined
  )
}
