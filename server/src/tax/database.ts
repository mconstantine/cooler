import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { CoolerError, PositiveInteger } from '../misc/Types'
import { DatabaseTaxCreationInput, Tax, TaxUpdateInput } from './interface'

export function getTaxById(
  id: PositiveInteger
): TaskEither<CoolerError, Option<Tax>> {
  return dbGet(SQL`SELECT * FROM tax WHERE id = ${id}`, Tax)
}

export function insertTax(
  tax: DatabaseTaxCreationInput
): TaskEither<CoolerError, PositiveInteger> {
  return insert('tax', tax, DatabaseTaxCreationInput)
}

export function updateTax(
  id: PositiveInteger,
  tax: TaxUpdateInput
): TaskEither<CoolerError, PositiveInteger> {
  return update('tax', id, tax, TaxUpdateInput)
}

export function deleteTax(
  id: PositiveInteger
): TaskEither<CoolerError, PositiveInteger> {
  return remove('tax', { id })
}
