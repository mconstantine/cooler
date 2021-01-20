import { FC } from 'react'
import { a18n } from '../../../a18n'
import * as t from 'io-ts'
import {
  LocalizedString,
  PositiveInteger,
  PositiveIntegerFromString
} from '../../../globalDomain'
import { TaskEither } from 'fp-ts/TaskEither'
import { useForm } from '../useForm'
import * as validators from '../validators'
import { option, taskEither } from 'fp-ts'
import { toSelectState } from '../Input/Select/Select'
import { Form } from '../Form'
import { AsyncSelect } from '../Input/AsyncSelect'
import { SimpleSelect } from '../Input/SimpleSelect'
import { DateTimePicker } from '../Input/DateTimePicker/DateTimePicker'
import { constFalse, constTrue, pipe } from 'fp-ts/function'
import { download } from 'ionicons/icons'

const TimePeriodValues = {
  week: a18n`This week`,
  month: a18n`This month`,
  custom: a18n`Custom`
}

const TimePeriod = t.keyof(TimePeriodValues, 'TimePeriod')
type TimePeriod = t.TypeOf<typeof TimePeriod>

function foldTimePeriod<T>(
  whenWeek: () => T,
  whenMonth: () => T,
  whenCustom: () => T
): (timePeriod: TimePeriod) => T {
  return timePeriod => {
    switch (timePeriod) {
      case 'week':
        return whenWeek()
      case 'month':
        return whenMonth()
      case 'custom':
        return whenCustom()
    }
  }
}

interface FormData {
  timePeriod: TimePeriod
  project: PositiveInteger
  since: Date
  to: Date
}

interface Props {
  findProjects: (
    input: string
  ) => TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>>
  onSubmit: (data: FormData) => TaskEither<LocalizedString, unknown>
}

export const TimesheetForm: FC<Props> = props => {
  const { fieldProps, formError, submit, values, setValues } = useForm(
    {
      initialValues: {
        project: toSelectState<PositiveInteger>({}, option.none),
        timePeriod: 'week' as TimePeriod,
        since: getLastMonday(),
        to: getNextFriday()
      },
      linters: () => ({}),
      validators: () => ({
        project: validators.fromSelectState<PositiveInteger>(
          a18n`Please choose a project`
        )
      })
    },
    {
      onSubmit: props.onSubmit
    }
  )

  const onTimePeriodChange = (timePeriod: TimePeriod) => {
    setValues({
      timePeriod,
      since: pipe(
        timePeriod,
        foldTimePeriod(
          getLastMonday,
          getFirstDayOfThisMonth,
          () => values.since
        )
      ),
      to: pipe(
        timePeriod,
        foldTimePeriod(getNextFriday, getLastDayOfThisMonth, () => values.to)
      )
    })
  }

  return (
    <Form
      title={a18n`New Timesheet`}
      formError={formError}
      submit={submit}
      submitLabel={a18n`Download`}
      submitIcon={download}
    >
      <AsyncSelect
        label={a18n`Project`}
        {...fieldProps('project')}
        onQueryChange={props.findProjects}
        emptyPlaceholder={a18n`No projects found`}
        codec={PositiveIntegerFromString}
      />
      <SimpleSelect
        label={a18n`Time period`}
        {...fieldProps('timePeriod')}
        options={TimePeriodValues}
        onChange={onTimePeriodChange}
      />
      <DateTimePicker
        mode="date"
        label={a18n`From`}
        {...fieldProps('since')}
        disabled={pipe(
          values.timePeriod,
          foldTimePeriod(constTrue, constTrue, constFalse)
        )}
      />
      <DateTimePicker
        mode="date"
        label={a18n`To`}
        {...fieldProps('to')}
        disabled={pipe(
          values.timePeriod,
          foldTimePeriod(constTrue, constTrue, constFalse)
        )}
      />
    </Form>
  )
}

function getFirstDayOfThisMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function getLastDayOfThisMonth(): Date {
  const now = new Date()
  const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return new Date(firstDayOfNextMonth.getTime() - 1)
}

function getLastMonday(): Date {
  const now = new Date()
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay() + 1
  )
}

function getNextFriday(): Date {
  const now = new Date()
  return new Date(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay() + 6
    ).getTime() - 1
  )
}
