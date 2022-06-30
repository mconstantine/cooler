import { boolean, option, readerTaskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { skull } from 'ionicons/icons'
import { useState } from 'react'
import { a18n } from '../../a18n'
import { Card } from '../../components/Card/Card'
import { TaxForm } from '../../components/Form/Forms/TaxForm'
import { useTaxes } from '../../contexts/TaxesContext'
import { useDialog } from '../../effects/useDialog'
import { Tax, TaxCreationInput } from '../../entities/Tax'
import { formatPercentarge, LocalizedString } from '../../globalDomain'

interface Props {
  tax: Tax
}

export function TaxCardForm(props: Props) {
  const { updateTax, deleteTax } = useTaxes()
  const [isEditing, setIsEditing] = useState(false)

  const updateTaxCommand = updateTax(props.tax.id)

  const [DeleteTaxDialog, deleteTaxCommand] = useDialog(
    () => deleteTax(props.tax.id),
    {
      title: () => a18n`Are you sure you want to delete "${props.tax.label}"?`,
      message: () => a18n`This action cannot be undone.`
    }
  )

  const onSubmit: ReaderTaskEither<TaxCreationInput, LocalizedString, void> =
    pipe(
      updateTaxCommand,
      readerTaskEither.chain(() =>
        readerTaskEither.fromIO(() => setIsEditing(false))
      )
    )

  const onEditButtonClick = () => setIsEditing(true)
  const onCancelEditing = () => setIsEditing(false)

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <>
          <Card
            label={option.none}
            content={props.tax.label}
            description={option.some(formatPercentarge(props.tax.value))}
            actions={[
              {
                type: 'sync',
                label: a18n`Edit`,
                action: onEditButtonClick
              },
              {
                type: 'async',
                icon: skull,
                label: a18n`Delete tax`,
                action: deleteTaxCommand(null),
                color: 'danger'
              }
            ]}
          />
          <DeleteTaxDialog />
        </>
      ),
      () => (
        <TaxForm
          tax={option.some(props.tax)}
          onSubmit={onSubmit}
          onCancel={option.some(onCancelEditing)}
        />
      )
    )
  )
}
