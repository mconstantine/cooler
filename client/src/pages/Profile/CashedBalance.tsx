import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { useState } from 'react'
import { a18n, formatMoneyAmount, unsafeLocalizedString } from '../../a18n'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { DateTimePicker } from '../../components/Form/Input/DateTimePicker/DateTimePicker'
import { List } from '../../components/List/List'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { useGet } from '../../effects/api/useApi'
import { CashedBalanceRequestInput, getCashedBalanceRequest } from './domain'
import { calculateNetValue, renderTaxItem } from './utils'

export function CashedBalance() {
  const { taxes } = useTaxes()

  const [input, setInput] = useState<CashedBalanceRequestInput>({
    since: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
      0,
      0,
      0,
      0
    )
  })

  const [cashedBalance] = useGet(getCashedBalanceRequest, input)

  return pipe(
    {
      balance: pipe(
        cashedBalance,
        query.map(({ balance }) => balance)
      ),
      taxes
    },
    sequenceS(query.Apply),
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      ({ balance, taxes }) => (
        <Panel title={a18n`Cashed balance`} framed action={option.none}>
          <DateTimePicker
            name="cashedBalanceSince"
            mode="date"
            label={a18n`Since`}
            value={input.since}
            onChange={since => setInput({ since })}
            error={option.none}
            warning={option.none}
            disabled={query.isLoading(cashedBalance)}
          />
          <List
            heading={option.none}
            items={[
              {
                key: 'grossCashedAmount',
                type: 'valued',
                label: option.none,
                content: a18n`Cashed amount (gross)`,
                description: option.none,
                value: formatMoneyAmount(balance),
                progress: option.none
              },
              ...taxes.map(tax => renderTaxItem('cashedAmount', balance, tax)),
              {
                key: 'netCashedAmount',
                type: 'valued',
                label: option.none,
                content: a18n`Cashed amount (net)`,
                description: option.none,
                value: formatMoneyAmount(calculateNetValue(balance, taxes)),
                progress: option.none
              }
            ]}
            emptyListMessage={unsafeLocalizedString('')}
          />
        </Panel>
      )
    )
  )
}
