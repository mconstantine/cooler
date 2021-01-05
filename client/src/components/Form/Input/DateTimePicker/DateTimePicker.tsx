import { boolean, either, option } from 'fp-ts'
import { Either } from 'fp-ts/Either'
import { constNull, constVoid, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { FC, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { a18n, localizedMonthNames } from '../../../../a18n'
import { LocalizedString } from '../../../../globalDomain'
import { Button } from '../../../Button/Button/Button'
import { Buttons } from '../../../Button/Buttons/Buttons'
import { Modal } from '../../../Modal/Modal'
import { FieldProps } from '../../useForm'
import { CounterInput } from '../CounterInput/CounterInput'
import { CounterSelect } from '../CounterSelect/CounterSelect'
import { Input } from '../Input/Input'
import './DateTimePicker.scss'
import { DaysGrid } from './DaysGrid'
import * as t from 'io-ts'
import { calendar, time } from 'ionicons/icons'
import { Label } from '../../../Label/Label'
import { TextInput } from '../TextInput/TextInput'
import { DateFromISOString } from 'io-ts-types'

interface Props extends FieldProps {
  label: LocalizedString
  mode?: DateTimePickerOption
}

const DateTimePickerOptions = t.keyof(
  {
    date: true,
    time: true,
    datetime: true
  },
  'DateTimePickerOptions'
)
type DateTimePickerOption = t.TypeOf<typeof DateTimePickerOptions>

const DateTimePickerMode = t.keyof(
  {
    DATE: true,
    TIME: true
  },
  'DateTimePickerMode'
)
type DateTimePickerMode = t.TypeOf<typeof DateTimePickerMode>

function foldDateTimePickerMode<T>(
  whenDate: () => T,
  whenTime: () => T
): (mode: DateTimePickerMode) => T {
  return mode => {
    switch (mode) {
      case 'DATE':
        return whenDate()
      case 'TIME':
        return whenTime()
    }
  }
}

function validateYear(year: string): Either<LocalizedString, number> {
  return pipe(
    year,
    either.fromPredicate(
      year => /[0-9]{4}/.test(year),
      () => a18n`Year should be four digits`
    ),
    either.map(parseInt)
  )
}

function validateMonth(month: string): Either<LocalizedString, number> {
  return pipe(
    parseInt(month),
    either.fromPredicate(
      month => !isNaN(month) && month >= 0 && month <= 11,
      () => a18n`Month should be one of the available options`
    )
  )
}

function validateHours(hours: string): Either<LocalizedString, number> {
  return pipe(
    parseInt(hours),
    either.fromPredicate(
      hours => !isNaN(hours) && hours >= 0 && hours < 24,
      () => a18n`Hours should be a number between 0 and 23`
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
    parseInt(minutes),
    either.fromPredicate(
      minutes => !isNaN(minutes) && minutes >= 0 && minutes < 60,
      () => a18n`Minutes should be a number between 0 and 59`
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
  const value = pipe(
    DateFromISOString.decode(props.value),
    either.getOrElse(() => new Date())
  )

  const [isOpen, setIsOpen] = useState(false)
  const [year, setYear] = useState(value.getFullYear().toString(10))
  const [month, setMonth] = useState(value.getMonth().toString(10))

  const [currentMode, setCurrentMode] = useState<DateTimePickerMode>(
    mode === 'time' ? 'TIME' : 'DATE'
  )

  const [hours, setHours] = useState(fixHours(value.getHours().toString(10)))

  const [minutes, setMinutes] = useState(
    fixMinutes(value.getMinutes().toString(10))
  )

  const initialValueRef = useRef(value)
  const yearInputRef = useRef<HTMLInputElement>(null)
  const monthInputRef = useRef<HTMLInputElement>(null)
  const hoursInputRef = useRef<HTMLInputElement>(null)
  const minutesInputRef = useRef<HTMLInputElement>(null)

  const isPickingDate = mode === 'date' || mode === 'datetime'
  const isPickingTime = mode === 'time' || mode === 'datetime'
  const isPickingDateTime = mode === 'datetime'

  const yearValidation = useMemo(() => validateYear(year), [year])
  const yearError: Option<LocalizedString> = pipe(
    yearValidation,
    either.fold(option.some, () => option.none)
  )

  const monthValidation = validateMonth(month)
  const monthError: Option<LocalizedString> = pipe(
    monthValidation,
    either.fold(option.some, () => option.none)
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

    return props.onChange(date.toISOString())
  }

  const confirm = () => {
    initialValueRef.current = value
    onChange(value, true)
    setIsOpen(false)
    setCurrentMode('DATE')
  }

  const cancel = () => {
    onChange(initialValueRef.current, false)
    setIsOpen(false)
    setCurrentMode('DATE')
  }

  const onTimeInputKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirm()
    }
  }

  useEffect(() => {
    if (isOpen) {
      pipe(
        currentMode,
        foldDateTimePickerMode(
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
  }, [isOpen, currentMode])

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

  const options: Partial<Intl.DateTimeFormatOptions> = {
    ...(isPickingDate
      ? {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }
      : {}),
    ...(isPickingTime
      ? {
          hour: 'numeric',
          minute: 'numeric'
        }
      : {})
  }

  return (
    <div className="DateTimePicker">
      <Input
        {...props}
        className="DateTimePickerInput"
        value={value.toLocaleString(a18n.getLocale(), options)}
        onChange={constVoid}
        readOnly
        onFocus={() => setIsOpen(true)}
      />
      <Modal
        className="DateTimePickerModal"
        isOpen={isOpen}
        onClose={cancel}
        framed
      >
        {pipe(
          isPickingDateTime,
          boolean.fold(constNull, () => (
            <Buttons>
              <Button
                type="button"
                label={a18n`Date`}
                icon={option.some(calendar)}
                action={() => setCurrentMode('DATE')}
                flat
                color={pipe(
                  currentMode,
                  foldDateTimePickerMode(
                    () => 'primary',
                    () => 'default'
                  )
                )}
              />
              <Button
                type="button"
                label={a18n`Time`}
                icon={option.some(time)}
                action={() => setCurrentMode('TIME')}
                flat
                color={pipe(
                  currentMode,
                  foldDateTimePickerMode(
                    () => 'default',
                    () => 'primary'
                  )
                )}
              />
            </Buttons>
          ))
        )}
        {pipe(
          currentMode,
          foldDateTimePickerMode(
            () => (
              <>
                <CounterInput
                  ref={yearInputRef}
                  name={`${props.name}-year`}
                  label={a18n`Year`}
                  value={year}
                  onChange={setYear}
                  onBack={year => year - 1}
                  onForward={year => year + 1}
                  error={yearError}
                  warning={option.none}
                />
                <CounterSelect
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
                />
                <DaysGrid
                  year={pipe(
                    yearValidation,
                    either.getOrElse(() => value.getFullYear())
                  )}
                  month={pipe(
                    monthValidation,
                    either.getOrElse(() => value.getMonth())
                  )}
                  selection={value}
                  onChange={date => {
                    onChange(date, true)

                    if (mode === 'datetime') {
                      setCurrentMode('TIME')
                    }
                  }}
                  disabled={
                    either.isLeft(yearValidation) ||
                    either.isLeft(monthValidation)
                  }
                />
              </>
            ),
            () => (
              <div className="DateTimePickerTime">
                <TextInput
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
                <TextInput
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
