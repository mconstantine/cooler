import { ApolloError } from 'apollo-server-express'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { PositiveInteger } from '../misc/Types'
import { Tax, TaxCreationInput, TaxUpdateInput } from './interface'

export function getTaxById(
  id: PositiveInteger
): TaskEither<ApolloError, Option<Tax>> {
  return dbGet(SQL`SELECT * FROM tax WHERE id = ${id}`, Tax)
}

export function insertTax(
  tax: TaxCreationInput
): TaskEither<ApolloError, PositiveInteger> {
  return insert('tax', tax, TaxCreationInput)
}

export function updateTax(
  id: PositiveInteger,
  tax: TaxUpdateInput
): TaskEither<ApolloError, PositiveInteger> {
  return update('tax', id, tax, TaxUpdateInput)
}

export function deleteTax(
  id: PositiveInteger
): TaskEither<ApolloError, PositiveInteger> {
  return remove('tax', { id })
}
