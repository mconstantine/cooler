import { Client } from './Client'
import { getDatabase } from '../misc/getDatabase'
import { insert } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'

export async function createClient(client: Partial<Client>) {
  const db = await getDatabase()
  const { lastID } = await insert('client', client)

  return await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)
}

export async function listClients(args: ConnectionQueryArgs & { name?: string }) {
  return queryToConnection(
    args, ['*'], 'client', args.name ? SQL`WHERE name LIKE ${`%${args.name}%`}` : undefined
  )
}
