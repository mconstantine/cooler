import { Client } from './Client'
import { getDatabase } from '../misc/getDatabase'
import { insert } from '../misc/dbUtils'
import SQL from 'sql-template-strings'

export async function createClient(client: Partial<Client>) {
  const db = await getDatabase()
  const { lastID } = await insert('client', client)

  return await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)
}
