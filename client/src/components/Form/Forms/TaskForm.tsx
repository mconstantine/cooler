import { boolean, nonEmptyArray, option } from 'fp-ts'
import { constNull, constUndefined, pipe } from 'fp-ts/function'
import { useState } from 'react'
import { a18n, leadZero, unsafeLocalizedString } from '../../../a18n'
import {
  LocalizedString,
  NonNegativeInteger,
  NonNegativeNumber,
  NonNegativeNumberFromString
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
import {
  ProjectLabel,
  TaskCreationInput,
  TasksBatchCreationInput,
  TaskWithStats
} from '../../../entities/Task'
import { Body } from '../../Body/Body'
import { Modal } from '../../Modal/Modal'
import { Heading } from '../../Heading/Heading'
import { List } from '../../List/List'
import { close } from 'ionicons/icons'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'

export interface SingleTaskFormData extends TaskCreationInput {
  shouldRepeat: true
}

export interface TasksBatchFormData extends TasksBatchCreationInput {
  shouldRepeat: false
}

export type FormData = SingleTaskFormData | TasksBatchFormData

interface CommonProps {
  project: ProjectLabel
  onCancel: IO<void>
}

interface AddModeProps extends CommonProps {
  mode: 'add'
  onSubmit: ReaderTaskEither<FormData, LocalizedString, unknown>
}

interface EditModeProps extends CommonProps {
  mode: 'edit'
  task: TaskWithStats
  onSubmit: ReaderTaskEither<SingleTaskFormData, LocalizedString, unknown>
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
      return whenTasksBatch(data as unknown as TasksBatchFormData)
    } else {
      return whenSingleTask(data as unknown as SingleTaskFormData)
    }
  }
}

export function TaskForm(props: Props) {
  const { fieldProps, submit, formError, values } = useForm(
    {
      initialValues: pipe(
        props,
        foldFormMode(
          () => ({
            shouldRepeat: false,
            project: props.project._id,
            name: '',
            description: '',
            expectedWorkingHours: '',
            hourlyCost: '',
            startTime: new Date(),
            to: new Date(),
            repeat: 0 as NonNegativeInteger
          }),
          ({ task }) => ({
            ...task,
            description: pipe(
              task.description,
              option.getOrElse(() => '')
            ),
            expectedWorkingHours: task.expectedWorkingHours.toString(10),
            hourlyCost: task.hourlyCost.toString(10),
            shouldRepeat: false,
            project: props.project._id,
            to: task.startTime,
            repeat: 0 as NonNegativeInteger
          })
        )
      ),
      validators: ({ shouldRepeat }) => ({
        name: validators.nonBlankString(commonErrors.nonBlank),
        description: pipe(
          shouldRepeat,
          boolean.fold(() => validators.optionalString(), constUndefined)
        ),
        expectedWorkingHours: validators.fromCodec<NonNegativeNumber>(
          NonNegativeNumberFromString,
          a18n`Expected working hours should be a non negative number`
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
          props,
          foldFormMode(
            props => props.onSubmit(data as FormData),
            props => props.onSubmit(data as SingleTaskFormData)
          )
        )
    }
  )

  return (
    <Form
      title={a18n`New Task for "${props.project.name}"`}
      actions={option.none}
      formError={formError}
      submit={submit}
      additionalButtons={[
        {
          type: 'button',
          label: a18n`Cancel`,
          action: props.onCancel,
          icon: option.none
        }
      ]}
    >
      {pipe(
        props,
        foldFormMode(
          () => (
            <Toggle
              mode="boolean"
              label={a18n`Repeat`}
              {...fieldProps('shouldRepeat')}
            />
          ),
          constNull
        )
      )}
      <Input label={a18n`Name`} {...fieldProps('name')} />
      {pipe(
        props,
        foldFormMode(() => <NamingTips />, constNull)
      )}
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
        label={a18n`Expected working hours`}
        {...fieldProps('expectedWorkingHours')}
      />
      <Input label={a18n`Hourly cost`} {...fieldProps('hourlyCost')} />
      <DateTimePicker
        label={a18n`Starting at`}
        {...fieldProps('startTime')}
        mode="datetime"
      />
      {pipe(
        values.shouldRepeat,
        boolean.fold(constNull, () => (
          <>
            <DateTimePicker
              label={a18n`Ending on`}
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

function NamingTips() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const date = new Date(1970, 0, 8)

  return (
    <>
      <Body onClick={() => setIsModalOpen(true)}>
        {a18n`Pro tip: when "Repeat" is active, you can use some special characters for creating different names for repeating tasks. Click this message for some examples.`}
      </Body>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} framed>
        <Heading
          size={32}
          actions={option.some(
            nonEmptyArray.of({
              type: 'icon',
              action: () => setIsModalOpen(false),
              icon: close
            })
          )}
        >
          {a18n`Tips for repeating tasks' names`}
        </Heading>
        <Body>
          {a18n`You can use special characters for creating repeating tasks' names. For example, let's say you are creating tasks for the month of January 1970. You could use "DDDD MM/DD" for "Thursday 01/08" or "Day #" for "Day 8":`}
        </Body>
        <List
          heading={option.none}
          unwrapDescriptions
          emptyListMessage={unsafeLocalizedString('')}
          items={[
            {
              key: 'DDDD',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('DDDD'),
              description: option.none,
              value: unsafeLocalizedString(
                date.toLocaleDateString(undefined, { weekday: 'long' })
              ),
              progress: option.none
            },
            {
              key: 'DDD',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('DDD'),
              description: option.none,
              value: unsafeLocalizedString(
                date.toLocaleDateString(undefined, { weekday: 'short' })
              ),
              progress: option.none
            },
            {
              key: 'DD',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('DD'),
              description: option.none,
              value: unsafeLocalizedString(leadZero(date.getDate())),
              progress: option.none
            },
            {
              key: 'D',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('D'),
              description: option.none,
              value: unsafeLocalizedString(date.getDate().toString(10)),
              progress: option.none
            },
            {
              key: 'MMMM',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('MMMM'),
              description: option.none,
              value: unsafeLocalizedString(
                date.toLocaleString(undefined, { month: 'long' })
              ),
              progress: option.none
            },
            {
              key: 'MMM',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('MMM'),
              description: option.none,
              value: unsafeLocalizedString(
                date.toLocaleString(undefined, { month: 'short' })
              ),
              progress: option.none
            },
            {
              key: 'MM',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('MM'),
              description: option.none,
              value: unsafeLocalizedString(leadZero(date.getMonth() + 1)),
              progress: option.none
            },
            {
              key: 'M',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('M'),
              description: option.none,
              value: unsafeLocalizedString((date.getMonth() + 1).toString(10)),
              progress: option.none
            },
            {
              key: 'YYYY',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('YYYY'),
              description: option.none,
              value: unsafeLocalizedString(date.getFullYear().toString(10)),
              progress: option.none
            },
            {
              key: 'YY',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('YY'),
              description: option.none,
              value: unsafeLocalizedString(
                date.getFullYear().toString(10).substring(2)
              ),
              progress: option.none
            },
            {
              key: '#',
              type: 'valued',
              label: option.none,
              content: unsafeLocalizedString('#'),
              description: option.some(
                a18n`This represent the task's number, not the day's number. If your start date was January 6th, this would be 3`
              ),
              value: unsafeLocalizedString('8'),
              progress: option.none
            }
          ]}
        />
      </Modal>
    </>
  )
}
