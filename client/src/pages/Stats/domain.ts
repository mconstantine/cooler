import * as t from 'io-ts'
import { DateFromISOString } from 'io-ts-types'
import { makeGetRequest } from '../../effects/api/useApi'
import { NonNegativeNumber } from '../../globalDomain'

const CashPerMonthListItem = t.type(
  {
    monthDate: DateFromISOString,
    cash: NonNegativeNumber
  },
  'CashPerMonthListItem'
)

const CashPerMonth = t.array(CashPerMonthListItem, 'CashPerMonth')
export type CashPerMonth = t.TypeOf<typeof CashPerMonth>

const TimeRangeInput = t.type(
  {
    since: DateFromISOString,
    to: DateFromISOString
  },
  'TimeRangeInput'
)
export type TimeRangeInput = t.TypeOf<typeof TimeRangeInput>

export const getCashPerMonthRequest = makeGetRequest({
  url: '/users/stats/avg-cash-per-month',
  inputCodec: TimeRangeInput,
  outputCodec: CashPerMonth
})
