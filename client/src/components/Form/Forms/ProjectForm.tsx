import { boolean, option, taskEither } from 'fp-ts'
import { constNull, constUndefined, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { FC } from 'react'
import { a18n } from '../../../a18n'
import {
  LocalizedString,
  NonNegativeNumberFromString,
  OptionFromEmptyString,
  PositiveInteger,
  PositiveIntegerFromString
} from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Form } from '../Form'
import { DateTimePicker } from '../Input/DateTimePicker/DateTimePicker'
import { toSelectState } from '../Input/Select/Select'
import { TextArea } from '../Input/TextArea/TextArea'
import { Toggle } from '../Input/Toggle/Toggle'
import { useForm } from '../useForm'
import * as validators from '../validators'
import { Input } from '../Input/Input/Input'
import { AsyncSelect } from '../Input/AsyncSelect'
import { Project, ProjectCreationInput } from '../../../entities/Project'

interface Props {
  project: Option<Project>
  findClients: (
    input: string
  ) => TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>>
  onSubmit: (data: ProjectCreationInput) => TaskEither<LocalizedString, unknown>
}

export const ProjectForm: FC<Props> = props => {
  const { fieldProps, submit, formError, values } = useForm(
    {
      initialValues: pipe(
        props.project,
        option.map(project => ({
          ...project,
          description: pipe(
            project.description,
            option.getOrElse(() => '')
          ),
          client: toSelectState({}, option.some(project.client)),
          cashed: option.isSome(project.cashed),
          cashedAt: pipe(
            project.cashed,
            option.map(({ at }) => at),
            option.getOrElse(() => new Date())
          ),
          cashedBalance: pipe(
            project.cashed,
            option.map(({ balance }) => balance.toString(10)),
            option.getOrElse(() => '')
          )
        })),
        option.getOrElse(() => ({
          name: '',
          description: '',
          client: toSelectState<PositiveInteger>({}, option.none),
          cashed: false,
          cashedAt: new Date(),
          cashedBalance: ''
        }))
      ),
      validators: ({ cashed }) => ({
        name: validators.nonBlankString(commonErrors.nonBlank),
        description: validators.fromCodec(
          OptionFromEmptyString,
          commonErrors.nonBlank
        ),
        client: validators.fromSelectState(a18n`Please choose a client`),
        cashedBalance: pipe(
          cashed,
          boolean.fold(constUndefined, () =>
            validators.fromCodec(
              NonNegativeNumberFromString,
              commonErrors.moneyAmount
            )
          )
        )
      }),
      linters: () => ({})
    },
    {
      formValidator: input => {
        return pipe(
          input.cashed,
          boolean.fold(
            () => option.none,
            () =>
              option.some({
                at: input.cashedAt,
                balance: input.cashedBalance
              })
          ),
          cashed => ({
            name: input.name,
            description: input.description,
            client: input.client,
            cashed
          }),
          taskEither.right
        )
      }
    },
    {
      onSubmit: data => props.onSubmit(data as ProjectCreationInput)
    }
  )

  return (
    <Form title={a18n`New Project`} submit={submit} formError={formError}>
      <Input label={a18n`Name`} {...fieldProps('name')} />
      <TextArea label={a18n`Description`} {...fieldProps('description')} />
      <AsyncSelect
        label={a18n`Client`}
        {...fieldProps('client')}
        onQueryChange={props.findClients}
        emptyPlaceholder={a18n`No clients found`}
        codec={PositiveIntegerFromString}
      />

      <Toggle label={a18n`Cashed`} {...fieldProps('cashed')} />

      {pipe(
        values.cashed,
        boolean.fold(constNull, () => (
          <>
            <DateTimePicker
              label={a18n`Cashed on`}
              {...fieldProps('cashedAt')}
              mode="date"
            />
            <Input
              label={a18n`Cashed balance`}
              {...fieldProps('cashedBalance')}
            />
          </>
        ))
      )}
    </Form>
  )
}
