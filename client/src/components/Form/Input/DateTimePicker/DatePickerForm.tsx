import { either, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { forwardRef, Ref, useRef } from 'react'
import { a18n, localizedMonthNames } from '../../../../a18n'
import { Month, MonthFromString } from '../../../../globalDomain'
import { FieldProps } from '../../useForm'
import { CounterSelect } from '../CounterSelect/CounterSelect'
import { Input } from '../Input/Input'
import { getOptionValue, SelectState } from '../Select/Select'
import { DaysGrid } from './DaysGrid'
import { validateDay, validateYear } from './utils'

interface Props {
  inputName: string
  latestValidDate: Date
  yearFieldProps: FieldProps<string>
  monthFieldProps: FieldProps<SelectState<Month>>
  dayFieldProps: FieldProps<string>
  onDaySelected: () => unknown
}

export const DatePickerForm = forwardRef(
  (props: Props, ref?: Ref<HTMLInputElement>) => {
    const monthInputRef = useRef<HTMLInputElement>(null)

    const validYear = pipe(
      props.yearFieldProps.value,
      validateYear,
      either.getOrElse(() => props.latestValidDate.getFullYear())
    )

    const validMonth = pipe(
      getOptionValue(props.monthFieldProps.value),
      option.getOrElse(() => props.latestValidDate.getMonth())
    )

    const validDay = pipe(
      props.dayFieldProps.value,
      validateDay,
      either.getOrElse(() => props.latestValidDate.getDate())
    )

    const onYearChange = (year: string) => {
      props.yearFieldProps.onChange(year)

      pipe(
        year,
        validateYear,
        either.fold(constVoid, () => {
          if (year.length === 4) {
            monthInputRef.current?.focus()
            monthInputRef.current?.select()
          }
        })
      )
    }

    const onMonthBack = (month: Month): Month => {
      const res = (month - 1) as Month

      if (res < 0) {
        props.yearFieldProps.onChange(
          (parseInt(props.yearFieldProps.value) - 1).toString(10)
        )
      }

      return res
    }

    const onMonthForward = (month: Month): Month => {
      const res = (month + 1) as Month

      if (res > 11) {
        props.yearFieldProps.onChange(
          (parseInt(props.yearFieldProps.value) + 1).toString(10)
        )
      }

      return res
    }

    const onDayChange = (date: Date) => {
      props.dayFieldProps.onChange(date.getDate().toString(10))
      props.onDaySelected()
    }

    return (
      <>
        <Input
          ref={ref}
          label={a18n`Year`}
          {...props.yearFieldProps}
          id={props.inputName + props.yearFieldProps.name}
          name={props.inputName + props.yearFieldProps.name}
          className="DateTimePickerYear"
          onChange={onYearChange}
        />
        <CounterSelect
          codec={MonthFromString}
          ref={monthInputRef}
          label={a18n`Month`}
          {...props.monthFieldProps}
          name={props.inputName + props.monthFieldProps.name}
          onBack={onMonthBack}
          onForward={onMonthForward}
          options={localizedMonthNames}
          disabled={option.isSome(props.yearFieldProps.error)}
          className="DateTimePickerMonth"
        />
        <DaysGrid
          year={validYear}
          month={validMonth}
          selection={new Date(validYear, validMonth, validDay)}
          onChange={onDayChange}
          disabled={
            option.isSome(props.yearFieldProps.error) ||
            option.isSome(props.monthFieldProps.error)
          }
        />
      </>
    )
  }
)
