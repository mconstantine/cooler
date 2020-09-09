import { Client, ClientType } from './interface'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { User } from '../user/interface'
import { ApolloError } from 'apollo-server-express'

export async function createClient(client: Partial<Client>, user: User) {
  const db = await getDatabase()
  const { lastID } = await insert('client', { ...client, user: user.id })

  return await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${lastID}`)
}

export async function getClient(id: number, user: User) {
  const db = await getDatabase()
  const client = await db.get<Client>(
    SQL`SELECT * FROM client WHERE id = ${id}`
  )

  if (client && client.user !== user.id) {
    throw new ApolloError('You cannot see this client', 'COOLER_403')
  }

  return client
}

export async function listClients(
  args: ConnectionQueryArgs & { name?: string },
  user: User
) {
  const where = SQL`WHERE user = ${user.id}`

  args.name &&
    where.append(SQL` AND (
    (type = 'BUSINESS' AND business_name LIKE ${`%${args.name}%`}) OR
    (type = 'PRIVATE' AND first_name || ' ' || last_name LIKE ${`%${args.name}%`})
  )`)

  return queryToConnection(args, ['*'], 'client', where)
}

export async function updateClient(
  id: number,
  client: Partial<Client>,
  user: User
) {
  const db = await getDatabase()
  const savedClient = await db.get<Client>(
    SQL`SELECT user FROM client WHERE id = ${id}`
  )

  if (!savedClient) {
    return null
  }

  if (savedClient.user !== user.id) {
    throw new ApolloError('You cannot update this client', 'COOLER_403')
  }

  const {
    type,
    fiscal_code,
    first_name,
    last_name,
    country_code,
    vat_number,
    business_name,
    address_country,
    address_province,
    address_city,
    address_zip,
    address_street,
    address_street_number,
    address_email
  } = client

  if (
    type ||
    fiscal_code !== undefined ||
    first_name !== undefined ||
    last_name !== undefined ||
    country_code !== undefined ||
    vat_number !== undefined ||
    business_name !== undefined ||
    address_country ||
    address_province ||
    address_city ||
    address_zip ||
    address_street ||
    address_street_number ||
    address_email
  ) {
    const args: Partial<Client> = Object.entries({
      type,
      fiscal_code,
      first_name,
      last_name,
      country_code,
      vat_number,
      business_name,
      address_country,
      address_province,
      address_city,
      address_zip,
      address_street,
      address_street_number,
      address_email
    })
      .filter(([, value]) => value !== undefined)
      .reduce((res, [key, value]) => ({ ...res, [key]: value }), {})

    if (type) {
      switch (type) {
        case ClientType.PRIVATE:
          args.country_code = null
          args.vat_number = null
          args.business_name = null
          break
        case ClientType.BUSINESS:
          args.fiscal_code = null
          args.first_name = null
          args.last_name = null
          break
        default:
          return null
      }
    }

    await update('client', { ...args, id })
  }

  return await db.get<Client>(SQL`SELECT * FROM client WHERE id = ${id}`)
}

export async function deleteClient(id: number, user: User) {
  const db = await getDatabase()
  const client = await db.get<Client>(
    SQL`SELECT * FROM client WHERE id = ${id}`
  )

  if (!client) {
    return null
  }

  if (client.user !== user.id) {
    throw new ApolloError('You cannot delete this client', 'COOLER_403')
  }

  await remove('client', { id })
  return client
}
