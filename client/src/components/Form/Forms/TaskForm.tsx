import { boolean, option } from 'fp-ts'
import { constNull, constUndefined, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { Option } from 'fp-ts/Option'
import { FC } from 'react'
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
import {
  Task,
  TaskCreationInput,
  TasksBatchCreationInput
} from '../../../entities/Task'

export interface SingleTaskFormData extends TaskCreationInput {
  shouldRepeat: true
}

export interface TasksBatchFormData extends TasksBatchCreationInput {
  shouldRepeat: false
}

export type FormData = SingleTaskFormData | TasksBatchFormData

interface CommonProps {
  task: Option<Task>
  findProjects: Option<
    (
      input: string
    ) => TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>>
  >
  onSubmit: (
    data: TaskCreationInput | TasksBatchCreationInput
  ) => TaskEither<LocalizedString, unknown>
}

interface AddModeProps extends CommonProps {
  mode: 'add'
}

interface EditModeProps extends CommonProps {
  mode: 'edit'
}

type Props = AddModeProps | EditModeProps

function foldFormMode<T>(
  whenAdd: (props: AddModeProps) => T,
  whenEdit: (props: EditModeProps) => T
): (props: Props) => T {
  return props => {
    switch (props.mode) {
      case 'add':
        return whenAdd(props)
      case 'edit':
        return whenEdit(props)
    }
  }
}

export function foldFormData<T>(
  whenSingleTask: (data: SingleTaskFormData) => T,
  whenTasksBatch: (data: TasksBatchFormData) => T
): (data: FormData) => T {
  return data => {
    if (data.shouldRepeat) {
      return whenTasksBatch((data as unknown) as TasksBatchFormData)
    } else {
      return whenSingleTask((data as unknown) as SingleTaskFormData)
    }
  }
}

export const TaskForm: FC<Props> = props => {
  const { fieldProps, submit, formError, values } = useForm(
    {
      initialValues: pipe(
        props.task,
        option.map(task => ({
          ...task,
          description: pipe(
            task.description,
            option.getOrElse(() => '')
          ),
          expectedWorkingHours: task.expectedWorkingHours.toString(10),
          hourlyCost: task.hourlyCost.toString(10),
          shouldRepeat: false,
          project: toSelectState({}, option.some(task.project)),
          from: task.start_time,
          to: task.start_time,
          repeat: 0 as NonNegativeInteger
        })),
        option.getOrElse(() => ({
          shouldRepeat: false,
          project: toSelectState<PositiveInteger>({}, option.none),
          name: '',
          description: '',
          expectedWorkingHours: '',
          hourlyCost: '',
          start_time: new Date(),
          from: new Date(),
          to: new Date(),
          repeat: 0 as NonNegativeInteger
        }))
      ),
      validators: ({ shouldRepeat }) => ({
        project: validators.fromSelectState<PositiveInteger>(
          a18n`Please choose a project`
        ),
        name: validators.nonBlankString(commonErrors.nonBlank),
        description: pipe(
          shouldRepeat,
          boolean.fold(() => validators.optionalString(), constUndefined)
        ),
        expectedWorkingHours: validators.fromCodec<NonNegativeNumber>(
          NonNegativeNumberFromString,
          a18n`Expecting working hours should be a non negative number`
        ),
        hourlyCost: validators.fromCodec<NonNegativeNumber>(
          NonNegativeNumberFromString,
          a18n`Hourly cost should be a non negative number`
        )
      }),
      linters: () => ({})
    },
    {
      onSubmit: data =>
        pipe(
          data as FormData,
          foldFormData(
            data =>
              props.onSubmit({
                name: data.name,
                expectedWorkingHours: data.expectedWorkingHours,
                hourlyCost: data.hourlyCost,
                project: data.project,
                start_time: data.start_time,
                description: data.description
              }),
            data =>
              props.onSubmit({
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
  )

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
        values.shouldRepeat,
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
          values.shouldRepeat,
          boolean.fold(
            () => 'datetime',
            () => 'time'
          )
        )}
      />
      {pipe(
        props,
        foldFormMode(
          () => <Toggle label={a18n`Repeat`} {...fieldProps('shouldRepeat')} />,
          constNull
        )
      )}
      {pipe(
        values.shouldRepeat,
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
