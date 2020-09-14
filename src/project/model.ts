import {
  Project,
  ProjectCreationInput,
  ProjectFromDatabase,
  ProjectUpdateInput
} from './interface'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove, fromSQLDate } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection, mapConnection } from '../misc/queryToConnection'
import { User, UserFromDatabase } from '../user/interface'
import { ClientFromDatabase, Client } from '../client/interface'
import { ApolloError } from 'apollo-server-express'
import { Connection } from '../misc/Connection'
import { ID, SQLDate } from '../misc/Types'
import { fromDatabase as clientFromDatabase } from '../client/model'
import { removeUndefined } from '../misc/removeUndefined'

export async function createProject(
  { name, description, client: clientId }: ProjectCreationInput,
  user: User
): Promise<Project | null> {
  const db = await getDatabase()

  const client = await db.get<ClientFromDatabase>(
    SQL`SELECT * FROM client WHERE id = ${clientId}`
  )

  if (!client) {
    return null
  }

  if (client.user !== user.id) {
    throw new ApolloError(
      'You cannot create projects for this client',
      'COOLER_403'
    )
  }

  const { lastID } = await insert<ProjectCreationInput>('project', {
    name,
    description,
    client: clientId
  })

  if (!lastID) {
    return null
  }

  const newProject = await db.get<ProjectFromDatabase>(
    SQL`SELECT * FROM project WHERE id = ${lastID}`
  )

  if (!newProject) {
    return null
  }

  return fromDatabase(newProject)
}

export async function getProject(
  id: number,
  user: User
): Promise<Project | null> {
  const db = await getDatabase()

  const project = await db.get<ProjectFromDatabase & { user: ID }>(SQL`
    SELECT project.*, client.user
    FROM project
    JOIN client ON project.client = client.id
    WHERE project.id = ${id}
  `)

  if (!project) {
    return null
  }

  if (project.user !== user.id) {
    throw new ApolloError('You cannot see this project', 'COOLER_403')
  }

  return fromDatabase(project)
}

export async function listProjects(
  args: ConnectionQueryArgs & { name?: string },
  user: User
): Promise<Connection<Project>> {
  const sql = SQL`
    JOIN client ON project.client = client.id
    WHERE client.user = ${user.id}
  `

  args.name && sql.append(SQL` AND project.name LIKE ${`%${args.name}%`}`)

  const connection = await queryToConnection<ProjectFromDatabase>(
    args,
    ['project.*'],
    'project',
    sql
  )

  return mapConnection(connection, fromDatabase)
}

export async function updateProject(
  id: number,
  project: ProjectUpdateInput,
  user: User
): Promise<Project | null> {
  const db = await getDatabase()
  const { name, description, client, cashed_at, cashed_balance } = project

  const currentProject = await db.get<ProjectFromDatabase & { user: ID }>(SQL`
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

  if (
    name ||
    description ||
    client ||
    cashed_at !== undefined ||
    cashed_balance !== undefined
  ) {
    if (client) {
      const newClient = await db.get<ClientFromDatabase>(
        SQL`SELECT user FROM client WHERE id = ${client}`
      )

      if (!newClient) {
        return null
      }

      if (newClient.user !== user.id) {
        throw new ApolloError(
          'You cannot assign this client to a project',
          'COOLER_403'
        )
      }
    }

    const args = removeUndefined({
      name,
      description,
      client,
      cashed_at,
      cashed_balance
    })

    await update('project', { ...args, id })
  }

  const updatedProject = await db.get<ProjectFromDatabase>(
    SQL`SELECT * FROM project WHERE id = ${id}`
  )

  if (!updatedProject) {
    return null
  }

  return fromDatabase(updatedProject)
}

export async function deleteProject(
  id: number,
  user: User
): Promise<Project | null> {
  const db = await getDatabase()

  const project = await db.get<ProjectFromDatabase & { user: ID }>(SQL`
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

  return fromDatabase(project)
}

export async function getProjectClient(
  project: ProjectFromDatabase
): Promise<Client> {
  const db = await getDatabase()

  const client = await db.get<ClientFromDatabase>(
    SQL`SELECT * FROM client WHERE id = ${project.client}`
  )

  return clientFromDatabase(client!)
}

export async function getUserProjects(
  user: UserFromDatabase,
  args: ConnectionQueryArgs
): Promise<Connection<Project>> {
  const connection = await queryToConnection<ProjectFromDatabase>(
    args,
    ['project.*'],
    'project',
    SQL`
      JOIN client ON client.id = project.client
      WHERE client.user = ${user.id}
    `
  )

  return mapConnection(connection, fromDatabase)
}

export async function getUserCashedBalance(
  user: UserFromDatabase,
  since?: SQLDate
) {
  const db = await getDatabase()
  const sql = SQL`
    SELECT IFNULL(SUM(project.cashed_balance), 0) AS balance
    FROM project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND project.cashed_balance IS NOT NULL
  `

  since && sql.append(SQL` AND project.cashed_at >= ${since}`)

  const { balance } = (await db.get<{ balance: number }>(sql))!

  return balance
}

export async function getClientProjects(
  client: ClientFromDatabase,
  args: ConnectionQueryArgs
): Promise<Connection<Project>> {
  const connection = await queryToConnection<ProjectFromDatabase>(
    args,
    ['*'],
    'project',
    SQL`WHERE client = ${client.id}`
  )

  return mapConnection(connection, fromDatabase)
}

export function fromDatabase(project: ProjectFromDatabase): Project {
  return {
    ...project,
    created_at: fromSQLDate(project.created_at),
    updated_at: fromSQLDate(project.updated_at)
  }
}
