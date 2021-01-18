import { option } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { alert, warning as warningIcon } from 'ionicons/icons'
import { FC, useMemo } from 'react'
import { a18n } from '../../../../a18n'
import {
  Color,
  LocalizedString,
  NonNegativeInteger
} from '../../../../globalDomain'
import { composeClassName } from '../../../../misc/composeClassName'
import { Buttons } from '../../../Button/Buttons/Buttons'
import { Label } from '../../../Label/Label'
import { FieldProps } from '../../useForm'
import { ToggleButton } from '../ToggleButton'
import './WeekdayRepetition.scss'

interface Props extends FieldProps<NonNegativeInteger> {
  label: LocalizedString
  color?: Color
  disabled?: boolean
}

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

function foldWeekdayIndex<T>(
  when0: () => T,
  when1: () => T,
  when2: () => T,
  when3: () => T,
  when4: () => T,
  when5: () => T,
  when6: () => T
): (weekdayIndex: WeekdayIndex) => T {
  return index => {
    switch (index) {
      case 0:
        return when0()
      case 1:
        return when1()
      case 2:
        return when2()
      case 3:
        return when3()
      case 4:
        return when4()
      case 5:
        return when5()
      case 6:
        return when6()
    }
  }
}

function getWeekdayLabels(): LocalizedString[] {
  const date = new Date()
  date.setTime(date.getTime() - (date.getDay() - 1) * 86400000)
  const startTime = date.getTime()
  const labels: LocalizedString[] = []

  for (let i = 0; i < 7; i++) {
    date.setTime(startTime + 86400000 * i)
    labels.push(
      date.toLocaleDateString(a18n.getLocale(), {
        weekday: 'short'
      }) as LocalizedString
    )
  }

  return labels
}

function getValues(value: NonNegativeInteger): boolean[] {
  return [
    0x0000001,
    0x0000010,
    0x0000100,
    0x0001000,
    0x0010000,
    0x0100000,
    0x1000000
  ].map(n => !!(value & n))
}

function getChangedValue(
  value: NonNegativeInteger,
  index: WeekdayIndex
): NonNegativeInteger {
  const changingBit = pipe(
    index,
    foldWeekdayIndex(
      () => 0x0000001,
      () => 0x0000010,
      () => 0x0000100,
      () => 0x0001000,
      () => 0x0010000,
      () => 0x0100000,
      () => 0x1000000
    )
  )

  return (value ^ changingBit) as NonNegativeInteger
}

export const WeekdayRepetition: FC<Props> = props => {
  const labels: LocalizedString[] = useMemo(getWeekdayLabels, [])
  const values = getValues(props.value)

  const color: Color = pipe(
    props.error,
    option.fold(
      () =>
        pipe(
          props.warning,
          option.fold(
            () => props.color || 'default',
            () => 'warning'
          )
        ),
      () => 'danger'
    )
  )

  return (
    <div className={composeClassName('WeekdayRepetition', color)}>
      <Label content={props.label} color={color} />
      <Buttons>
        {labels.map((label, index) => (
          <ToggleButton
            key={label}
            name={`${props.name}-${label}`}
            type="button"
            icon={option.none}
            label={label}
            value={values[index]}
            onChange={() =>
              props.onChange(
                getChangedValue(props.value, index as WeekdayIndex)
              )
            }
            error={props.error}
            warning={props.warning}
            color={color}
            disabled={props.disabled}
          />
        ))}
      </Buttons>
      {pipe(
        props.error,
        option.fold(
          () =>
            pipe(
              props.warning,
              option.fold(constNull, warning => (
                <div className="warning">
                  <Label content={warning} icon={warningIcon} color="warning" />
                </div>
              ))
            ),
          error => (
            <div className="error">
              <Label content={error} icon={alert} color="danger" />
            </div>
          )
        )
      )}
    </div>
  )
}
