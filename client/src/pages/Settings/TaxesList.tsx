import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { a18n } from '../../a18n'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { TaxCardForm } from './TaxCardForm'

export function TaxesList() {
  const { taxes } = useTaxes()

  return pipe(
    taxes,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error.message} />,
      taxes => (
        <Panel title={a18n`Taxes`} action={option.none} framed>
          {taxes.map(tax => (
            <TaxCardForm key={tax.id} tax={tax} />
          ))}
        </Panel>
      )
    )
  )
}
