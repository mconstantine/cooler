import { boolean, option, readerTaskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { add } from 'ionicons/icons'
import { useState } from 'react'
import { a18n } from '../../a18n'
import { Button } from '../../components/Button/Button/Button'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { TaxForm } from '../../components/Form/Forms/TaxForm'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { Separator } from '../../components/Separator/Separator'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { TaxCardForm } from './TaxCardForm'

export function TaxesList() {
  const { createTax, taxes } = useTaxes()
  const [isCreating, setIsCreating] = useState(false)
  const onAddButtonClick = () => setIsCreating(true)
  const onCancelAdding = () => setIsCreating(false)

  const createTaxCommand = pipe(
    createTax,
    readerTaskEither.chain(() =>
      readerTaskEither.fromIO(() => setIsCreating(false))
    )
  )

  return pipe(
    taxes,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      taxes => (
        <Panel title={a18n`Taxes`} action={option.none} framed>
          {taxes.map(tax => (
            <TaxCardForm key={tax._id} tax={tax} />
          ))}
          <Separator />
          {pipe(
            isCreating,
            boolean.fold(
              () => (
                <Button
                  type="button"
                  icon={option.some(add)}
                  action={onAddButtonClick}
                  label={a18n`New Tax`}
                  color="primary"
                />
              ),
              () => (
                <TaxForm
                  tax={option.none}
                  onSubmit={createTaxCommand}
                  onCancel={option.some(onCancelAdding)}
                />
              )
            )
          )}
        </Panel>
      )
    )
  )
}
