import { option } from 'fp-ts'
import { formatMoneyAmount } from '../../a18n'
import { ValuedItem } from '../../components/List/List'
import { Tax } from '../../entities/Tax'

export function renderTaxItem(
  key: string,
  grossValue: number,
  tax: Tax
): ValuedItem {
  const taxedFraction = -(grossValue * tax.value)

  return {
    key: `${key}-${tax.label}`,
    type: 'valued',
    label: option.none,
    content: tax.label,
    description: option.none,
    value: formatMoneyAmount(taxedFraction),
    progress: option.none,
    valueColor: 'danger',
    size: 'small'
  }
}

export function calculateNetValue(grossValue: number, taxes: Tax[]): number {
  return taxes.reduce((res, { value }) => res - grossValue * value, grossValue)
}
