import { Tax } from './interface'
import { User } from '../user/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { insert, update, remove } from '../misc/dbUtils'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server-express'
import { queryToConnection } from '../misc/queryToConnection'

export async function createTax(tax: Partial<Tax>, user: User) {
  if ((!tax.value && tax.value !== 0) || tax.value < 0 || tax.value > 1) {
    throw new ApolloError('value should be a number between zero and one', 'COOLER_400')
  }

  const db = await getDatabase()
  const { lastID } = await insert('tax', { ...tax, user: user.id })

  return await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${lastID}`)
}

export async function getTax(id: number, user: User) {
  const db = await getDatabase()
  const tax = await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${id}`)

  if (!tax) {
    return null
  }

  if (tax.user !== user.id) {
    throw new ApolloError('You cannot see this tax', 'COOLER_403')
  }

  return tax
}

export function listTaxes(args: ConnectionQueryArgs, user: User) {
  return queryToConnection(args, ['tax.*'], 'tax', SQL`WHERE user = ${user.id}`)
}

export async function updateTax(id: number, data: Partial<Tax>, user: User) {
  const db = await getDatabase()
  const tax = await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${id}`)

  if (!tax) {
    return null
  }

  if (tax.user !== user.id) {
    throw new ApolloError('You cannot update this tax', 'COOLER_403')
  }

  if (data.user !== undefined && data.user !== tax.user) {
    throw new ApolloError('You cannot update users of taxes', 'COOLER_403')
  }

  const { label, value } = data

  if (label || value !== undefined) {
    if ((!value && value !== 0) || value < 0 || value > 1) {
      throw new ApolloError('value should be a number between zero and one', 'COOLER_400')
    }

    const args = Object.entries({ label, value }).filter(
      ([, value]) => value !== undefined
    ).reduce(
      (res, [key, value]) => ({ ...res, [key]: value }), {}
    )

    await update('tax', { id, ...args })
  }

  return await db.get<Tax>(SQL`SELECT * FROM tax WHERE id = ${id}`)
}

export async function deleteTax(id: number, user: User) {
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
