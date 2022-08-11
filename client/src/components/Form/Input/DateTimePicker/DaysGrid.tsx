import { option } from 'fp-ts'
import { a18n, unsafeLocalizedString } from '../../../../a18n'
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
  const firstDayOfMonth = new Date(props.year, props.month, 1)
  const today = new Date()

  const nearestSunday = new Date(
    props.year,
    props.month,
    1 - firstDayOfMonth.getDay()
  )

  const weekDayLabels = new Array(7).fill(null).map((_, index) =>
    unsafeLocalizedString(
      new Date(
        nearestSunday.getFullYear(),
        nearestSunday.getMonth(),
        nearestSunday.getDate() + index + 1
      ).toLocaleDateString(a18n.getLocale(), {
        weekday: 'short'
      })
    )
  )

  const days = new Array(42)
    .fill(null)
    .map(
      (_, index) =>
        new Date(
          nearestSunday.getFullYear(),
          nearestSunday.getMonth(),
          nearestSunday.getDate() + index + 1
        )
    )

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
          label={unsafeLocalizedString(
            day.toLocaleDateString(a18n.getLocale(), {
              day: 'numeric'
            })
          )}
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
