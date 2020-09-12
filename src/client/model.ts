import {
  Client,
  ClientType,
  ClientFromDatabase,
  PrivateClient,
  BusinessClient,
  ClientCreationInput,
  ClientUpdateInput
} from './interface'
import { getDatabase } from '../misc/getDatabase'
import { insert, update, remove, fromSQLDate } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection, mapConnection } from '../misc/queryToConnection'
import { User, UserFromDatabase } from '../user/interface'
import { ApolloError } from 'apollo-server-express'
import { Connection } from '../misc/Connection'
import { fromDatabase as userFromDatabase } from '../user/model'
import { ID } from '../misc/Types'

type TypedClient = {
  type: ClientType
}

export async function createClient(
  {
    address_city,
    address_country,
    address_email,
    address_province,
    address_street,
    address_street_number,
    address_zip,
    business_name,
    country_code,
    first_name,
    fiscal_code,
    last_name,
    type,
    vat_number
  }: ClientCreationInput,
  user: User
): Promise<Client | null> {
  const db = await getDatabase()

  const { lastID } = await insert<ClientCreationInput & { user: ID }>(
    'client',
    {
      address_city,
      address_country,
      address_email,
      address_province,
      address_street,
      address_street_number,
      address_zip,
      business_name,
      country_code,
      first_name,
      fiscal_code,
      last_name,
      type,
      vat_number,
      user: user.id
    }
  )

  if (!lastID) {
    return null
  }

  const newClient = await db.get<ClientFromDatabase>(
    SQL`SELECT * FROM client WHERE id = ${lastID}`
  )

  if (!newClient) {
    return null
  }

  return fromDatabase(newClient)
}

export async function getClient(
  id: number,
  user: User
): Promise<Client | null> {
  const db = await getDatabase()
  const client = await db.get<ClientFromDatabase>(
    SQL`SELECT * FROM client WHERE id = ${id}`
  )

  if (!client) {
    return null
  }

  if (client && client.user !== user.id) {
    throw new ApolloError('You cannot see this client', 'COOLER_403')
  }

  return fromDatabase(client)
}

export async function listClients(
  args: ConnectionQueryArgs & { name?: string },
  user: User
): Promise<Connection<Client>> {
  const where = SQL`WHERE user = ${user.id}`

  args.name &&
    where.append(SQL` AND (
    (type = 'BUSINESS' AND business_name LIKE ${`%${args.name}%`}) OR
    (type = 'PRIVATE' AND first_name || ' ' || last_name LIKE ${`%${args.name}%`})
  )`)

  const connection = await queryToConnection<ClientFromDatabase>(
    args,
    ['*'],
    'client',
    where
  )

  return mapConnection(connection, fromDatabase)
}

export async function updateClient(
  id: number,
  client: ClientUpdateInput,
  user: User
): Promise<Client | null> {
  const db = await getDatabase()

  const savedClient = await db.get<ClientFromDatabase>(
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
    let args: Partial<Client> = Object.entries({
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

    if (args.type) {
      args = {
        ...args,
        ...foldClientType(args as TypedClient, {
          whenPrivate: () => ({
            country_code: null,
            vat_number: null,
            business_name: null
          }),
          whenBusiness: () => ({
            fiscal_code: null,
            first_name: null,
            last_name: null
          })
        })
      } as TypedClient
    }

    await update('client', { ...args, id })
  }

  const updatedClient = await db.get<ClientFromDatabase>(
    SQL`SELECT * FROM client WHERE id = ${id}`
  )

  if (!updatedClient) {
    return null
  }

  return fromDatabase(updatedClient)
}

export async function deleteClient(
  id: number,
  user: User
): Promise<Client | null> {
  const db = await getDatabase()
  const client = await db.get<ClientFromDatabase>(
    SQL`SELECT * FROM client WHERE id = ${id}`
  )

  if (!client) {
    return null
  }

  if (client.user !== user.id) {
    throw new ApolloError('You cannot delete this client', 'COOLER_403')
  }

  await remove('client', { id })
  return fromDatabase(client)
}

export function getClientName(
  client:
    | Pick<PrivateClient, 'type' | 'first_name' | 'last_name'>
    | Pick<BusinessClient, 'type' | 'business_name'>
): string {
  return foldClientType(client, {
    whenPrivate: client => `${client.first_name} ${client.last_name}`,
    whenBusiness: client => client.business_name
  })
}

export async function getClientUser(client: ClientFromDatabase): Promise<User> {
  const db = await getDatabase()
  const user = (await db.get<UserFromDatabase>(
    SQL`SELECT * FROM user WHERE id = ${client.user}`
  ))!

  return userFromDatabase(user)
}

export function foldClientType<
  I extends Partial<Client> & { type: ClientType },
  PO = I,
  BO = PO
>(
  client: I,
  match: {
    whenPrivate: (client: I & { type: ClientType.PRIVATE }) => PO
    whenBusiness: (client: I & { type: ClientType.BUSINESS }) => BO
  }
): PO | BO {
  switch (client.type) {
    case ClientType.PRIVATE:
      return match.whenPrivate(client as I & PrivateClient)
    case ClientType.BUSINESS:
      return match.whenBusiness(client as I & BusinessClient)
  }
}

export async function getUserClients(
  user: UserFromDatabase,
  args: ConnectionQueryArgs
): Promise<Connection<Client>> {
  const connection = await queryToConnection<ClientFromDatabase>(
    args,
    ['*'],
    'client',
    SQL`WHERE user = ${user.id}`
  )

  return mapConnection(connection, fromDatabase)
}

export function fromDatabase(client: ClientFromDatabase): Client {
  return {
    ...client,
    created_at: fromSQLDate(client.created_at),
    updated_at: fromSQLDate(client.updated_at)
  }
}
