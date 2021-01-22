import { boolean, either, option } from 'fp-ts'
import { Either } from 'fp-ts/Either'
import { constNull, constVoid, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { FC, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  a18n,
  formatDate,
  formatDateTime,
  formatTime,
  localizedMonthNames
} from '../../../../a18n'
import {
  LocalizedString,
  NonNegativeIntegerFromString
} from '../../../../globalDomain'
import { Button } from '../../../Button/Button/Button'
import { Buttons } from '../../../Button/Buttons/Buttons'
import { Modal } from '../../../Modal/Modal'
import { FieldProps } from '../../useForm'
import { CounterSelect } from '../CounterSelect/CounterSelect'
import { Input } from '../Input/Input'
import './DateTimePicker.scss'
import { DaysGrid } from './DaysGrid'
import * as t from 'io-ts'
import { calendar, time } from 'ionicons/icons'
import { Label } from '../../../Label/Label'
import { IntFromString, NumberFromString } from 'io-ts-types'
import { getOptionValue, useSelectState } from '../Select/Select'

interface Props extends FieldProps<Date> {
  label: LocalizedString
  mode?: DateTimePickerMode
  disabled?: boolean
}

const DateTimePickerMode = t.keyof(
  {
    date: true,
    time: true,
    datetime: true
  },
  'DateTimePickerOptions'
)
export type DateTimePickerMode = t.TypeOf<typeof DateTimePickerMode>

function foldDateTimePickerMode<T>(
  whenDate: () => T,
  whenTime: () => T,
  whenDateTime: () => T
): (mode: DateTimePickerMode) => T {
  return mode => {
    switch (mode) {
      case 'date':
        return whenDate()
      case 'time':
        return whenTime()
      case 'datetime':
        return whenDateTime()
    }
  }
}

type DateTimePickerView = 'date' | 'time'

function foldDateTimePickerView<T>(
  whenDate: () => T,
  whenTime: () => T
): (view: DateTimePickerView) => T {
  return view => {
    switch (view) {
      case 'date':
        return whenDate()
      case 'time':
        return whenTime()
    }
  }
}

function validateYear(year: string): Either<LocalizedString, number> {
  return pipe(
    IntFromString.decode(year),
    either.mapLeft(() => a18n`Year should be a positive number`)
  )
}

function validateHours(hours: string): Either<LocalizedString, number> {
  return pipe(
    NonNegativeIntegerFromString.decode(hours),
    either.mapLeft(() => a18n`Hours should be a non negative number`),
    either.chain(
      either.fromPredicate(
        hours => hours >= 0 && hours < 24,
        () => a18n`Hours should be a number between 0 and 23`
      )
    )
  )
}

function formatHours(input: string): string {
  if (input === '') {
    return input
  }

  const hours = parseInt(input)

  if (isNaN(hours)) {
    return input
  }

  if (hours > 2 && hours < 10) {
    return `0${hours}`
  }

  if (hours > 23) {
    return '23'
  }

  return input
}

function fixHours(hours: string): string {
  if (/^[0-9]$/.test(hours)) {
    return `0${hours}`
  }

  return hours
}

function validateMinutes(minutes: string): Either<LocalizedString, number> {
  return pipe(
    NonNegativeIntegerFromString.decode(minutes),
    either.mapLeft(() => a18n`Minutes should be a non negative number`),
    either.chain(
      either.fromPredicate(
        minutes => minutes >= 0 && minutes < 60,
        () => a18n`Hours should be a number between 0 and 59`
      )
    )
  )
}

function formatMinutes(input: string): string {
  if (input === '') {
    return input
  }

  const minutes = parseInt(input)

  if (isNaN(minutes)) {
    return input
  }

  if (minutes > 5 && minutes < 10) {
    return `0${minutes}`
  }

  if (minutes > 59) {
    return '59'
  }

  return input
}

function fixMinutes(minutes: string): string {
  if (/^[0-9]$/.test(minutes)) {
    return `0${minutes}`
  }

  return minutes
}

export const DateTimePicker: FC<Props> = ({ mode = 'datetime', ...props }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [year, setYear] = useState(props.value.getFullYear().toString(10))
  const [month, setMonth] = useSelectState(
    localizedMonthNames,
    option.some(props.value.getMonth())
  )

  const [currentView, setCurrentView] = useState<DateTimePickerView>(
    mode === 'time' ? 'time' : 'date'
  )

  const [hours, setHours] = useState(
    fixHours(props.value.getHours().toString(10))
  )

  const [minutes, setMinutes] = useState(
    fixMinutes(props.value.getMinutes().toString(10))
  )

  const initialValueRef = useRef(props.value)
  const yearInputRef = useRef<HTMLInputElement>(null)
  const monthInputRef = useRef<HTMLInputElement>(null)
  const hoursInputRef = useRef<HTMLInputElement>(null)
  const minutesInputRef = useRef<HTMLInputElement>(null)

  const isPickingDate = mode === 'date' || mode === 'datetime'
  const isPickingTime = mode === 'time' || mode === 'datetime'

  const yearValidation = useMemo(() => validateYear(year), [year])
  const yearError: Option<LocalizedString> = pipe(
    yearValidation,
    either.fold(option.some, () => option.none)
  )

  const monthError: Option<LocalizedString> = pipe(
    getOptionValue(month),
    option.fold(
      () => option.some(a18n`Month should be one of the available options`),
      () => option.none
    )
  )

  const hoursValidation = useMemo(() => validateHours(hours), [hours])
  const hoursError: Option<LocalizedString> = pipe(
    hoursValidation,
    either.fold(option.some, () => option.none)
  )

  const minutesValidation = validateMinutes(minutes)
  const minutesError: Option<LocalizedString> = pipe(
    minutesValidation,
    either.fold(option.some, () => option.none)
  )

  const onChange = (date: Date, setTime: boolean): void => {
    if (setTime) {
      if (either.isRight(hoursValidation)) {
        date.setHours(hoursValidation.right)
      }

      if (either.isRight(minutesValidation)) {
        date.setMinutes(minutesValidation.right)
      }
    }

    return props.onChange(date)
  }

  const confirm = () => {
    initialValueRef.current = props.value
    onChange(props.value, true)
    setIsOpen(false)
    setCurrentView('date')
  }

  const cancel = () => {
    onChange(initialValueRef.current, false)
    setIsOpen(false)
    setCurrentView('time')
  }

  const onTimeInputKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirm()
    }
  }

  useEffect(() => {
    if (isOpen) {
      pipe(
        currentView,
        foldDateTimePickerView(
          () => {
            yearInputRef.current?.focus()
            yearInputRef.current?.select()
          },
          () => {
            hoursInputRef.current?.focus()
            hoursInputRef.current?.select()
          }
        )
      )
    }
  }, [isOpen, currentView])

  useEffect(() => {
    if (either.isRight(hoursValidation) && hours.length === 2) {
      minutesInputRef.current?.focus()
      minutesInputRef.current?.select()
    }
  }, [hours, hoursValidation])

  useEffect(() => {
    if (either.isRight(yearValidation) && year.length === 4) {
      monthInputRef.current?.focus()
      monthInputRef.current?.select()
    }
  }, [year, yearValidation])

  return (
    <div className="DateTimePicker">
      <Input
        {...props}
        className="DateTimePickerInput"
        value={pipe(
          mode,
          foldDateTimePickerMode(
            () => formatDate(props.value),
            () => formatTime(props.value),
            () => formatDateTime(props.value)
          )
        )}
        onChange={constVoid}
        readOnly
        onFocus={() => !props.disabled && setIsOpen(true)}
        disabled={props.disabled}
      />
      <Modal
        className="DateTimePickerModal"
        isOpen={isOpen}
        onClose={cancel}
        framed
      >
        {pipe(
          isPickingDate && isPickingTime,
          boolean.fold(constNull, () => (
            <Buttons>
              <Button
                type="button"
                label={a18n`Date`}
                icon={option.some(calendar)}
                action={() => setCurrentView('date')}
                flat
                color={pipe(
                  currentView,
                  foldDateTimePickerView(
                    () => 'primary',
                    () => 'default'
                  )
                )}
              />
              <Button
                type="button"
                label={a18n`Time`}
                icon={option.some(time)}
                action={() => setCurrentView('time')}
                flat
                color={pipe(
                  currentView,
                  foldDateTimePickerView(
                    () => 'default',
                    () => 'primary'
                  )
                )}
              />
            </Buttons>
          ))
        )}
        {pipe(
          currentView,
          foldDateTimePickerView(
            () => (
              <>
                <Input
                  ref={yearInputRef}
                  name={`${props.name}-year`}
                  label={a18n`Year`}
                  value={year}
                  onChange={setYear}
                  error={yearError}
                  warning={option.none}
                  className="DateTimePickerYear"
                />
                <CounterSelect
                  codec={NumberFromString}
                  ref={monthInputRef}
                  name={`${props.name}-month`}
                  label={a18n`Month`}
                  value={month}
                  onChange={setMonth}
                  onBack={month => {
                    const res = month - 1

                    if (res < 0) {
                      setYear((parseInt(year) - 1).toString(10))
                    }

                    return res
                  }}
                  onForward={month => {
                    const res = month + 1

                    if (res > 11) {
                      setYear((parseInt(year) + 1).toString(10))
                    }

                    return res
                  }}
                  error={monthError}
                  warning={option.none}
                  options={localizedMonthNames}
                  disabled={either.isLeft(yearValidation)}
                  className="DateTimePickerMonth"
                />
                <DaysGrid
                  year={pipe(
                    yearValidation,
                    either.getOrElse(() => props.value.getFullYear())
                  )}
                  month={pipe(
                    getOptionValue(month),
                    option.getOrElse(() => props.value.getMonth())
                  )}
                  selection={props.value}
                  onChange={date => {
                    onChange(date, true)

                    if (mode === 'datetime') {
                      setCurrentView('time')
                    }
                  }}
                  disabled={
                    either.isLeft(yearValidation) ||
                    option.isNone(getOptionValue(month))
                  }
                />
              </>
            ),
            () => (
              <div className="DateTimePickerTime">
                <Input
                  ref={hoursInputRef}
                  name={`${props.name}-hours`}
                  label={a18n`Hours`}
                  value={hours}
                  onChange={flow(formatHours, setHours)}
                  error={hoursError}
                  warning={option.none}
                  onBlur={() => setHours(fixHours)}
                  onKeyUp={onTimeInputKeyUp}
                />
                <Label content={':' as LocalizedString} />
                <Input
                  ref={minutesInputRef}
                  name={`${props.name}-minutes`}
                  label={a18n`Minutes`}
                  value={minutes}
                  onChange={flow(formatMinutes, setMinutes)}
                  error={minutesError}
                  warning={option.none}
                  onBlur={() => setMinutes(fixMinutes)}
                  onKeyUp={onTimeInputKeyUp}
                />
              </div>
            )
          )
        )}
        <Buttons>
          <Button
            type="button"
            label={a18n`Confirm`}
            action={confirm}
            icon={option.none}
            color="primary"
            flat
          />
          <Button
            type="button"
            label={a18n`Cancel`}
            action={cancel}
            icon={option.none}
            flat
          />
        </Buttons>
      </Modal>
    </div>
  )
}
