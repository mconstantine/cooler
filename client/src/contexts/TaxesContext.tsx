import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Tax, TaxCreationInput, TaxUpdateInput } from '../entities/Tax'
import { CoolerError } from '../effects/api/useApi'
import { Query } from '../effects/api/Query'

interface TaxesContext {
  taxes: Query<CoolerError, NonEmptyArray<Tax>>
  createTaxCommand: ReaderTaskEither<TaxCreationInput, CoolerError, void>
  updateTaxCommand: ReaderTaskEither<TaxUpdateInput, CoolerError, void>
  deleteTaxCommand: ReaderTaskEither<Tax, CoolerError, void>
}

export declare function useTaxes(): TaxesContext
