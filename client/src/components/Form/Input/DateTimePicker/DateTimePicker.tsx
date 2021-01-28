import { boolean, option, taskEither } from 'fp-ts'
import { constNull, constVoid, flow, pipe } from 'fp-ts/function'
import { FC, useEffect, useRef, useState } from 'react'
import {
  a18n,
  formatDate,
  formatDateTime,
  formatTime,
  localizedMonthNames
} from '../../../../a18n'
import {
  LocalizedString,
  Month,
  MinuteFromString
} from '../../../../globalDomain'
import { Button } from '../../../Button/Button/Button'
import { Buttons } from '../../../Button/Buttons/Buttons'
import { Modal } from '../../../Modal/Modal'
import { FieldProps, useForm } from '../../useForm'
import { Input } from '../Input/Input'
import './DateTimePicker.scss'
import * as t from 'io-ts'
import { calendar, time } from 'ionicons/icons'
import { toSelectState } from '../Select/Select'
import * as validators from '../../validators'
import { leadZero, validateDay, validateHours, validateYear } from './utils'
import { DatePickerForm } from './DatePickerForm'
import { TimePickerForm } from './TimePickerForm'

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

function getInitialValues(date: Date) {
  return {
    year: date.getFullYear().toString(10),
    month: toSelectState(
      localizedMonthNames,
      option.some(date.getMonth() as Month)
    ),
    day: date.getDate().toString(10),
    hours: leadZero(date.getHours().toString(10)),
    minutes: leadZero(date.getMinutes().toString(10))
  }
}

export const DateTimePicker: FC<Props> = ({ mode = 'datetime', ...props }) => {
  const [isOpen, setIsOpen] = useState(false)

  const { fieldProps, setValues, submit } = useForm(
    {
      initialValues: getInitialValues(props.value),
      validators: () => ({
        year: flow(validateYear, taskEither.fromEither),
        month: validators.fromSelectState(a18n`This is not a valid month`),
        day: flow(validateDay, taskEither.fromEither),
        hours: flow(validateHours, taskEither.fromEither),
        minutes: validators.fromCodec(
          MinuteFromString,
          a18n`This is not a valid value for minutes`
        )
      }),
      linters: () => ({})
    },
    {
      onSubmit: data =>
        taskEither.fromIO(() =>
          props.onChange(
            new Date(
              data.year,
              data.month as Month,
              data.day,
              data.hours,
              data.minutes
            )
          )
        )
    }
  )

  const [currentView, setCurrentView] = useState<DateTimePickerView>(
    mode === 'time' ? 'time' : 'date'
  )

  const dateInputRef = useRef<HTMLInputElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)

  const isPickingDate = mode === 'date' || mode === 'datetime'
  const isPickingTime = mode === 'time' || mode === 'datetime'

  const confirm = () => {
    setCurrentView('date')
    setIsOpen(false)
    submit()
  }

  const cancel = () => {
    setCurrentView('date')
    setIsOpen(false)
    setValues(getInitialValues(props.value))
  }

  const inputValue = pipe(
    mode,
    foldDateTimePickerMode(
      () => formatDate(props.value),
      () => formatTime(props.value),
      () => formatDateTime(props.value)
    )
  )

  const onInputFocus = () => {
    if (!props.disabled) {
      setIsOpen(true)

      window.setTimeout(
        () =>
          pipe(
            currentView,
            foldDateTimePickerView(
              () => {
                dateInputRef.current?.focus()
                dateInputRef.current?.select()
              },
              () => {
                timeInputRef.current?.focus()
                timeInputRef.current?.select()
              }
            )
          ),
        200
      )
    }
  }

  const onDaySelected = () => {
    if (mode === 'datetime') {
      setCurrentView('time')
    }
  }

  useEffect(() => {
    setCurrentView(mode === 'time' ? 'time' : 'date')
  }, [mode])

  useEffect(() => {
    window.setTimeout(
      () =>
        pipe(
          currentView,
          foldDateTimePickerView(
            () => {
              dateInputRef.current?.focus()
              dateInputRef.current?.select()
            },
            () => {
              timeInputRef.current?.focus()
              timeInputRef.current?.select()
            }
          )
        ),
      200
    )
  }, [currentView])

  return (
    <div className="DateTimePicker">
      <Input
        {...props}
        className="DateTimePickerInput"
        value={inputValue}
        onChange={constVoid}
        readOnly
        onFocus={onInputFocus}
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
              <DatePickerForm
                inputName={props.name}
                latestValidDate={props.value}
                yearFieldProps={fieldProps('year')}
                monthFieldProps={fieldProps('month')}
                dayFieldProps={fieldProps('day')}
                onDaySelected={onDaySelected}
                ref={dateInputRef}
              />
            ),
            () => (
              <TimePickerForm
                inputName={props.name}
                hoursFieldProps={fieldProps('hours')}
                minutesFieldProps={fieldProps('minutes')}
                onConfirm={confirm}
                ref={timeInputRef}
              />
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
