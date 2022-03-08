import { option } from 'fp-ts'
import { skull } from 'ionicons/icons'
import { a18n } from '../../a18n'
import { Card } from '../../components/Card/Card'
import { useTaxes } from '../../contexts/TaxesContext'
import { Tax } from '../../entities/Tax'
import { formatPercentarge } from '../../globalDomain'

interface Props {
  tax: Tax
}

export function TaxCardForm(props: Props) {
  // TODO: implement switch to form and update logic, then creation
  const { deleteTax } = useTaxes()
  const deleteTaxCommand = deleteTax(props.tax.id)

  return (
    <Card
      label={option.none}
      content={props.tax.label}
      description={option.some(formatPercentarge(props.tax.value))}
      actions={[
        {
          type: 'async',
          icon: skull,
          label: a18n`Delete tax`,
          action: deleteTaxCommand,
          color: 'danger'
        }
      ]}
    />
  )
}
