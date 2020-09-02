import { Project } from './Project'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { User } from '../user/User'
import { Client } from '../client/Client'
import { ApolloError } from 'apollo-server-express'

export async function createProject(project: Partial<Project>, user: User) {
  const db = await getDatabase()
  const client = await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${project.client}`)

  if (!client) {
    return null
  }

  if (client.user !== user.id) {
    throw new ApolloError('You cannot create projects for this client', 'COOLER_403')
  }

  const { lastID } = await insert('project', project)
  return await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${lastID}`)
}

export async function getProject(id: number, user: User) {
  const db = await getDatabase()

  const project = await db.get<Project & { user: number }>(SQL`
    SELECT project.*, client.user
    FROM project
    JOIN client ON project.client = client.id
    WHERE project.id = ${id}
  `)

  if (project && project.user !== user.id) {
    throw new ApolloError('You cannot see this project', 'COOLER_403')
  }

  return project
}

export async function listProjects(args: ConnectionQueryArgs & { name?: string }, user: User) {
  const sql = SQL`
    JOIN client ON project.client = client.id
    WHERE client.user = ${user.id}
  `

  args.name && sql.append(SQL` AND project.name LIKE ${`%${args.name}%`}`)
  return await queryToConnection(args, ['project.*'], 'project', sql)
}

export async function updateProject(id: number, project: Partial<Project>, user: User) {
  const db = await getDatabase()
  const { name, description, client, cashed_at } = project

  const currentProject = await db.get<Project & { user: number }>(SQL`
    SELECT project.client, client.user
    FROM project
    JOIN client ON project.client = client.id
    WHERE project.id = ${id}`)

  if (!currentProject) {
    return null
  }

  if (currentProject.user !== user.id) {
    throw new ApolloError('You cannot update this project', 'COOLER_403')
  }

  if (name || description || client || cashed_at !== undefined) {
    if (client) {
      const newClient = await db.get<Client>(SQL`SELECT user FROM client WHERE id = ${client}`)

      if (!newClient) {
        return null
      }

      if (newClient.user !== user.id) {
        throw new ApolloError('You cannot assign this client to a project', 'COOLER_403')
      }
    }

    const args = Object.entries({ name, description, client, cashed_at }).filter(
      ([, value]) => value !== undefined
    ).reduce(
      (res, [key, value]) => ({ ...res, [key]: value }), {}
    )

    await update('project', { ...args, id })
  }

  return await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${id}`)
}

export async function deleteProject(id: number, user: User) {
  const db = await getDatabase()

  const project = await db.get<Project & { user: number }>(SQL`
    SELECT project.*, client.user
    FROM project
    JOIN client ON project.client = client.id
    WHERE project.id = ${id}
  `)

  if (!project) {
    return null
  }

  if (project.user !== user.id) {
    throw new ApolloError('You cannot delete this project', 'COOLER_403')
  }

  await remove('project', { id })

  return project
}
