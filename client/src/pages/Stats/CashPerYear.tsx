import { array, option, record } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { a18n, formatMoneyAmount, unsafeLocalizedString } from '../../a18n'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { List, ValuedItem } from '../../components/List/List'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { calculateNetValue } from '../Profile/utils'

interface Props {
  data: Record<string, number>
}

export function CashPerYear(props: Props) {
  const { taxes } = useTaxes()

  return pipe(
    taxes,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      taxes => (
        <List
          heading={option.some(a18n`Cashed amount per year`)}
          emptyListMessage={a18n`No data found`}
          items={pipe(
            props.data,
            record.toArray,
            array.map(([yearString, cashedAmount]): ValuedItem => {
              const netValue = formatMoneyAmount(
                calculateNetValue(cashedAmount, taxes)
              )

              return {
                key: yearString,
                type: 'valued',
                label: option.none,
                content: unsafeLocalizedString(yearString),
                description: option.some(a18n`Net value: ${netValue}`),
                value: formatMoneyAmount(cashedAmount),
                progress: option.none
              }
            })
          )}
        />
      )
    )
  )
}
