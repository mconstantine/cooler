import { Project } from './Project'
import { getDatabase } from '../misc/getDatabase'
import { insert } from '../misc/dbUtils'
import SQL from 'sql-template-strings'

export async function createProject(project: Partial<Project>) {
  const db = await getDatabase()
  const { lastID } = await insert('project', project)

  return await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${lastID}`)
}
