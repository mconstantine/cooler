import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useState } from 'react'
import { a18n } from '../../a18n'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { DateTimePicker } from '../../components/Form/Input/DateTimePicker/DateTimePicker'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { query } from '../../effects/api/api'
import { useGet } from '../../effects/api/useApi'
import { CashPerMonthChart } from './CashPerMonth'
import { getCashPerMonthRequest, TimeRangeInput } from './domain'

export default function Stats() {
  const [input, setInput] = useState<TimeRangeInput>({
    since: new Date(new Date().getFullYear() - 1, 0, 1),
    to: new Date(new Date().getFullYear() + 1, 0, 1)
  })

  const [cashPerMonth] = useGet(getCashPerMonthRequest, input)

  return (
    <Panel framed actions={option.none} title={a18n`Avg cash per month`}>
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
        cashPerMonth,
        query.fold(
          () => <LoadingBlock />,
          error => <ErrorPanel error={error} />,
          cashPerMonth => <CashPerMonthChart data={cashPerMonth} />
        )
      )}
    </Panel>
  )
}
