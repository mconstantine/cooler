import { array, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { useState } from 'react'
import { a18n } from '../../a18n'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { DateTimePicker } from '../../components/Form/Input/DateTimePicker/DateTimePicker'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { TaxesProvider } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { Query } from '../../effects/api/Query'
import { useGet } from '../../effects/api/useApi'
import { LocalizedString } from '../../globalDomain'
import { CashPerMonthChart } from './CashPerMonth'
import { getCashPerMonthRequest, TimeRangeInput, CashPerMonth } from './domain'
import { CashPerYear } from './CashPerYear'

export default function Stats() {
  const [input, setInput] = useState<TimeRangeInput>({
    since: new Date(new Date().getFullYear() - 1, 0, 1),
    to: new Date(new Date().getFullYear() + 1, 0, 1)
  })

  const [cashPerMonth] = useGet(getCashPerMonthRequest, input)

  const cashPerYear: Query<LocalizedString, Record<string, number>> = pipe(
    cashPerMonth,
    query.map(
      array.reduce<CashPerMonth['0'], Record<string, number>>(
        {},
        (res, { monthDate, cash }) => {
          const yearString = monthDate.getFullYear().toString(10)

          return {
            ...res,
            [yearString]: (res[yearString] || 0) + cash
          }
        }
      )
    )
  )

  return (
    <Panel framed actions={option.none} title={a18n`Avg cash per month`}>
      <TaxesProvider>
        <DateTimePicker
          mode="date"
          label={a18n`Since`}
          name="cashPerMonthSince"
          value={input.since}
          onChange={since => setInput(input => ({ ...input, since }))}
          error={option.none}
          warning={option.none}
        />
        <DateTimePicker
          mode="date"
          label={a18n`Until`}
          name="cashPerMonthTo"
          value={input.to}
          onChange={to => setInput(input => ({ ...input, to }))}
          error={option.none}
          warning={option.none}
        />
        {pipe(
          {
            cashPerMonth,
            cashPerYear
          },
          sequenceS(query.Apply),
          query.fold(
            () => <LoadingBlock />,
            error => <ErrorPanel error={error} />,
            ({ cashPerMonth, cashPerYear }) => (
              <>
                <CashPerMonthChart data={cashPerMonth} />
                <CashPerYear data={cashPerYear} />
              </>
            )
          )
        )}
      </TaxesProvider>
    </Panel>
  )
}
