import { Tax, TaxCreationInput, TaxUpdateInput } from './interface'
import { User, UserFromDatabase } from '../user/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { insert, update, remove } from '../misc/dbUtils'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server-express'
import { queryToConnection } from '../misc/queryToConnection'
import { Connection } from '../misc/Connection'
import { fromDatabase as userFromDatabase } from '../user/model'
import { definitely } from '../misc/definitely'
import { removeUndefined } from '../misc/removeUndefined'

export async function createTax(
  { label, value }: TaxCreationInput,
  user: User
): Promise<Tax | null> {
  if (value < 0 || value > 1) {
    throw new ApolloError(
      'value should be a number between zero and one',
      'COOLER_400'
    )
  }

  const db = await getDatabase()
  const { lastID } = await insert('tax', { label, value, user: user.id })
  const newTax = await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${lastID}`)

  if (!newTax) {
    return null
  }

  return newTax
}

export async function getTax(id: number, user: User): Promise<Tax | null> {
  const db = await getDatabase()
  const tax = await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${id}`)

  if (!tax) {
    return null
  }

  if (tax.user !== user.id) {
    throw new ApolloError('You cannot see this tax', 'COOLER_403')
  }

  return tax
}

export function listTaxes(
  args: ConnectionQueryArgs,
  user: User
): Promise<Connection<Tax>> {
  return queryToConnection(args, ['tax.*'], 'tax', SQL`WHERE user = ${user.id}`)
}

export async function updateTax(
  id: number,
  data: TaxUpdateInput,
  user: User
): Promise<Tax | null> {
  const db = await getDatabase()
  const tax = await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${id}`)

  if (!tax) {
    return null
  }

  if (tax.user !== user.id) {
    throw new ApolloError('You cannot update this tax', 'COOLER_403')
  }

  const { label, value } = data

  if (label || value !== undefined) {
    if ((!value && value !== 0) || value < 0 || value > 1) {
      throw new ApolloError(
        'value should be a number between zero and one',
        'COOLER_400'
      )
    }

    const args = removeUndefined({ label, value })

    await update('tax', { id, ...args })
  }

  const updatedTax = await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${id}`)

  if (!updatedTax) {
    return null
  }

  return updatedTax
}

export async function deleteTax(id: number, user: User): Promise<Tax | null> {
  const db = await getDatabase()
  const tax = await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${id}`)

  if (!tax) {
    return null
  }

  if (tax.user !== user.id) {
    throw new ApolloError('You cannot delete this tax', 'COOLER_403')
  }

  await remove('tax', { id })
  return tax
}

export async function getTaxUser(tax: Tax): Promise<User> {
  const db = await getDatabase()

  const user = definitely(
    await db.get<UserFromDatabase>(
      SQL`SELECT * FROM user WHERE id = ${tax.user}`
    )
  )

  return userFromDatabase(user)
}

export function getUserTaxes(
  user: UserFromDatabase,
  args: ConnectionQueryArgs
): Promise<Connection<Tax>> {
  return queryToConnection<Tax>(
    args,
    ['tax.*'],
    'tax',
    SQL`WHERE tax.user = ${user.id}`
  )
}
