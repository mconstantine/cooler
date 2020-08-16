import { Client } from './Client'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { User } from '../user/User'
import { ApolloError } from 'apollo-server'

export async function createClient(client: Partial<Client>) {
  const db = await getDatabase()
  const { lastID } = await insert('client', client)

  return await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)
}

export async function listClients(args: ConnectionQueryArgs & { name?: string, user: number }) {
  const where = SQL`WHERE user = ${args.user}`
  args.name && where.append(SQL` AND name LIKE ${`%${args.name}%`}`)
  return queryToConnection(args, ['*'], 'client', where)
}

export async function updateClient(id: number, client: Partial<Client>, user: User) {
  const db = await getDatabase()
  const savedClient = await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${id}`)

  if (!savedClient) {
    return null
  }

  if (savedClient.user !== user.id) {
    throw new ApolloError('You cannot update this client', 'COOLER_403')
  }

  const { name } = client

  if (name) {
    await update('client', { id, name })
  }

  return await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${id}`)
}

export async function deleteClient(id: number, user: User) {
  const db = await getDatabase()
  const client = await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${id}`)

  if (!client) {
    return null
  }

  if (client.user !== user.id) {
    throw new ApolloError('You cannot delete this client', 'COOLER_403')
  }

  await remove('client', { id })
  return client
}
