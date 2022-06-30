import { option } from 'fp-ts'
import { a18n } from '../../../../a18n'
import { LocalizedString } from '../../../../globalDomain'
import { Button } from '../../../Button/Button/Button'
import { Banner } from '../../../Banner/Banner'
import './DaysGrid.scss'

interface Props {
  year: number
  month: number
  selection: Date
  onChange: (date: Date) => void
  disabled?: boolean
}

export function DaysGrid(props: Props) {
  const date = new Date(props.year, props.month, 1)
  const today = new Date()

  date.setDate(1 - date.getDay())

  const weekDayLabels = new Array(7).fill(null).map(() => {
    date.setDate(date.getDate() + 1)

    return date.toLocaleDateString(a18n.getLocale(), {
      weekday: 'short'
    }) as LocalizedString
  })

  date.setDate(1)
  date.setDate(1 - date.getDay())

  const days = new Array(35).fill(null).map(() => {
    date.setDate(date.getDate() + 1)
    return new Date(date)
  })

  return (
    <div className="DaysGrid">
      {weekDayLabels.map(s => (
        <Banner key={s} content={s} />
      ))}
      {days.map(day => (
        <Button
          key={day.toISOString()}
          type="button"
          flat
          label={
            day.toLocaleDateString(a18n.getLocale(), {
              day: 'numeric'
            }) as LocalizedString
          }
          icon={option.none}
          action={() => props.onChange(day)}
          disabled={props.disabled || day.getMonth() !== props.month}
          color={isSameDay(day, today) ? 'primary' : 'default'}
          selected={isSameDay(day, props.selection)}
        />
      ))}
    </div>
  )
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}
