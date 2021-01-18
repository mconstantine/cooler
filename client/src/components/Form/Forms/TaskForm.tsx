import { boolean, option } from 'fp-ts'
import { constNull, flow, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { Option } from 'fp-ts/Option'
import { NonEmptyString } from 'io-ts-types'
import { FC, useState } from 'react'
import { a18n } from '../../../a18n'
import {
  LocalizedString,
  NonNegativeInteger,
  NonNegativeNumber,
  NonNegativeNumberFromString,
  PositiveInteger,
  PositiveIntegerFromString
} from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Form } from '../Form'
import { DateTimePicker } from '../Input/DateTimePicker/DateTimePicker'
import { Input } from '../Input/Input/Input'
import { TextArea } from '../Input/TextArea/TextArea'
import { Toggle } from '../Input/Toggle/Toggle'
import { WeekdayRepetition } from '../Input/WeekdayRepetition/WeekdayRepetition'
import { useForm } from '../useForm'
import * as validators from '../validators'
import { toSelectState } from '../Input/Select/Select'
import { AsyncSelect } from '../Input/AsyncSelect'

interface CommonFormData {
  name: NonEmptyString
  expectedWorkingHours: NonNegativeNumber
  hourlyCost: NonNegativeNumber
  project: PositiveInteger
  start_time: Date
}

interface SingleTaskFormData extends CommonFormData {
  description: Option<NonEmptyString>
}

interface TasksBatchFormData extends CommonFormData {
  repeat: NonNegativeInteger
  from: Date
  to: Date
}

type FormData = SingleTaskFormData | TasksBatchFormData

interface Props {
  findProjects: Option<
    (
      input: string
    ) => TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>>
  >
  onSubmit: (data: FormData) => TaskEither<LocalizedString, unknown>
}

function foldFormDataWithState<T>(
  shouldRepeat: boolean,
  callback: (data: FormData) => T
): (data: SingleTaskFormData & TasksBatchFormData) => T {
  return data =>
    pipe(
      shouldRepeat,
      boolean.fold(
        () =>
          callback({
            name: data.name,
            expectedWorkingHours: data.expectedWorkingHours,
            hourlyCost: data.hourlyCost,
            project: data.project,
            start_time: data.start_time,
            description: data.description
          }),
        () =>
          callback({
            name: data.name,
            expectedWorkingHours: data.expectedWorkingHours,
            hourlyCost: data.hourlyCost,
            project: data.project,
            start_time: data.start_time,
            repeat: data.repeat,
            from: data.from,
            to: data.to
          })
      )
    )
}

export const TaskForm: FC<Props> = props => {
  const [shouldRepeat, setShouldRepeat] = useState(false)

  const { fieldProps, submit, formError } = useForm({
    initialValues: {
      project: toSelectState<PositiveInteger>({}, option.none),
      name: '',
      description: '',
      expectedWorkingHours: '',
      hourlyCost: '',
      start_time: new Date(),
      from: new Date(),
      to: new Date(),
      repeat: 0 as NonNegativeInteger
    },
    validators: {
      project: validators.fromSelectState<PositiveInteger>(
        a18n`Please choose a project`
      ),
      name: validators.nonBlankString(commonErrors.nonBlank),
      description: pipe(
        shouldRepeat,
        boolean.fold(
          () => validators.optionalString(),
          () => validators.passThrough<string, Option<NonEmptyString>>()
        )
      ),
      expectedWorkingHours: validators.fromCodec<NonNegativeNumber>(
        NonNegativeNumberFromString,
        a18n`Expecting working hours should be a non negative number`
      ),
      hourlyCost: validators.fromCodec<NonNegativeNumber>(
        NonNegativeNumberFromString,
        a18n`Hourly cost should be a non negative number`
      ),
      start_time: validators.passThrough<Date>(),
      from: validators.passThrough<Date>(),
      to: validators.passThrough<Date>(),
      repeat: validators.passThrough<NonNegativeInteger>()
    },
    linters: {},
    formValidator: validators.passThrough<
      SingleTaskFormData & TasksBatchFormData
    >(),
    onSubmit: flow(foldFormDataWithState(shouldRepeat, props.onSubmit))
  })

  return (
    <Form title={a18n`New Task`} formError={formError} submit={submit}>
      {pipe(
        props.findProjects,
        option.fold(constNull, findProjects => (
          <AsyncSelect
            label={a18n`Project`}
            {...fieldProps('project')}
            onQueryChange={findProjects}
            emptyPlaceholder={a18n`No projects found`}
            codec={PositiveIntegerFromString}
          />
        ))
      )}
      <Input label={a18n`Name`} {...fieldProps('name')} />
      {pipe(
        shouldRepeat,
        boolean.fold(
          () => (
            <TextArea
              label={a18n`Description`}
              {...fieldProps('description')}
            />
          ),
          constNull
        )
      )}
      <Input
        label={a18n`Expecting working hours`}
        {...fieldProps('expectedWorkingHours')}
      />
      <Input label={a18n`Hourly cost`} {...fieldProps('hourlyCost')} />
      <DateTimePicker
        label={a18n`Starting at`}
        {...fieldProps('start_time')}
        mode={pipe(
          shouldRepeat,
          boolean.fold(
            () => 'datetime',
            () => 'time'
          )
        )}
      />
      <Toggle
        name="shouldRepeat"
        label={a18n`Repeat`}
        value={shouldRepeat}
        onChange={setShouldRepeat}
        error={option.none}
        warning={option.none}
      />
      {pipe(
        shouldRepeat,
        boolean.fold(constNull, () => (
          <>
            <DateTimePicker
              label={a18n`From`}
              {...fieldProps('from')}
              mode="date"
            />
            <DateTimePicker
              label={a18n`To`}
              {...fieldProps('to')}
              mode="date"
            />
            <WeekdayRepetition
              label={a18n`Repeat on`}
              {...fieldProps('repeat')}
            />
          </>
        ))
      )}
    </Form>
  )
}
