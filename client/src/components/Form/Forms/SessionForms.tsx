import { TaskEither } from 'fp-ts/TaskEither'
import { Option } from 'fp-ts/Option'
import { FC, useState } from 'react'
import {
  LocalizedString,
  PositiveInteger,
  PositiveIntegerFromString
} from '../../../globalDomain'
import { Session, SessionCreationInput } from '../../../entities/Session'
import { useForm } from '../useForm'
import { constFalse, constNull, constTrue, pipe } from 'fp-ts/function'
import { boolean, option } from 'fp-ts'
import { toSelectState } from '../Input/Select/Select'
import * as validators from '../validators'
import { a18n, formatDuration } from '../../../a18n'
import { Form } from '../Form'
import { AsyncSelect } from '../Input/AsyncSelect'
import { DateTimePicker } from '../Input/DateTimePicker/DateTimePicker'
import { Toggle } from '../Input/Toggle/Toggle'
import { Body } from '../../Body/Body'

interface Props {
  session: Option<Session>
  findTasks: Option<
    (
      input: string
    ) => TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>>
  >
  onSubmit: (data: SessionCreationInput) => TaskEither<LocalizedString, unknown>
}

export const SessionForm: FC<Props> = props => {
  const [didSessionEnd, setDidSessionEnd] = useState(
    pipe(
      props.session,
      option.fold(constFalse, session =>
        pipe(session.end_time, option.fold(constFalse, constTrue))
      )
    )
  )

  const { fieldProps, formError, submit, values, setValues } = useForm(
    {
      initialValues: pipe(
        props.session,
        option.fold(
          () => ({
            task: toSelectState<PositiveInteger>({}, option.none),
            start_time: new Date(Math.floor(Date.now() / 60000) * 60000),
            end_time: option.none
          }),
          session => ({
            task: toSelectState({}, option.some(session.task.id)),
            start_time: session.start_time,
            end_time: session.end_time
          })
        )
      ),
      validators: () => ({
        task: validators.fromSelectState(
          a18n`Please choose a task for this session`
        )
      }),
      linters: () => ({})
    },
    {
      formValidator: validators.fromPredicate(
        data =>
          pipe(data as SessionCreationInput, data =>
            pipe(
              data.end_time,
              option.fold(
                constTrue,
                end_time => end_time.getTime() - data.start_time.getTime() > 0
              )
            )
          ),
        a18n`Time is not negative and zero-time sessions don't exist`
      )
    },
    {
      onSubmit: data => props.onSubmit(data as SessionCreationInput)
    }
  )

  const onToggleChange = (value: boolean) => {
    setDidSessionEnd(value)
    setValues({
      end_time: pipe(
        value,
        boolean.fold(
          () => option.none,
          () => option.some(values.start_time)
        )
      )
    })
  }

  return (
    <Form
      title={a18n`New Session`}
      headingAction={option.none}
      formError={formError}
      submit={submit}
    >
      {pipe(
        props.findTasks,
        option.fold(constNull, findTasks => (
          <AsyncSelect
            label={a18n`Task`}
            {...fieldProps('task')}
            onQueryChange={findTasks}
            codec={PositiveIntegerFromString}
            emptyPlaceholder={a18n`No tasks found`}
          />
        ))
      )}
      <DateTimePicker label={a18n`Start time`} {...fieldProps('start_time')} />
      <Toggle
        name="didSessionEnd"
        label={a18n`This session already ended`}
        value={didSessionEnd}
        onChange={onToggleChange}
        error={option.none}
        warning={option.none}
      />
      {pipe(
        values.end_time,
        option.fold(constNull, end_time => {
          const duration = end_time.getTime() - values.start_time.getTime()
          const durationString = formatDuration(duration)

          return (
            <>
              <DateTimePicker
                label={a18n`End time`}
                {...fieldProps('end_time')}
                value={end_time}
                onChange={time => setValues({ end_time: option.some(time) })}
              />
              <Body
                color={duration > 0 ? 'primary' : 'danger'}
              >{a18n`Duration (hours): ${durationString}`}</Body>
            </>
          )
        })
      )}
    </Form>
  )
}
