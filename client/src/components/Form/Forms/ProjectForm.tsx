import { boolean, option, taskEither } from 'fp-ts'
import { constNull, constUndefined, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { a18n } from '../../../a18n'
import {
  LocalizedString,
  NonNegativeNumber,
  NonNegativeNumberFromString,
  ObjectId,
  ObjectIdFromString,
  OptionFromEmptyString,
  PositiveInteger
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
import {
  ProjectCreationInput,
  ProjectWithStats
} from '../../../entities/Project'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'

interface Props {
  project: Option<ProjectWithStats>
  findClients: ReaderTaskEither<
    string,
    LocalizedString,
    Record<PositiveInteger, LocalizedString>
  >
  onSubmit: ReaderTaskEither<ProjectCreationInput, LocalizedString, unknown>
  onCancel: IO<void>
}

export function ProjectForm(props: Props) {
  const { fieldProps, submit, formError, values } = useForm(
    {
      initialValues: pipe(
        props.project,
        option.map(project => ({
          name: project.name,
          description: pipe(
            project.description,
            option.getOrElse(() => '')
          ),
          client: toSelectState(
            {
              [project.client._id]: project.client.name
            },
            option.some(project.client._id)
          ),
          cashed: option.isSome(project.cashData),
          cashedAt: pipe(
            project.cashData,
            option.map(({ at }) => at),
            option.getOrElse(() => new Date())
          ),
          expectedBudget: pipe(
            project.expectedBudget,
            option.map(_ => _.toString(10)),
            option.getOrElse(() => '')
          ),
          cashedBalance: pipe(
            project.cashData,
            option.map(({ amount }) => amount.toString(10)),
            option.getOrElse(() => '')
          )
        })),
        option.getOrElse(() => ({
          name: '',
          description: '',
          client: toSelectState<ObjectId>({}, option.none),
          expectedBudget: '',
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
        expectedBudget: validators.optional(
          validators.fromCodec<NonNegativeNumber>(
            NonNegativeNumberFromString,
            a18n`Expected budget should be a non negative number`
          )
        ),
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
                amount: input.cashedBalance
              })
          ),
          cashData => ({
            name: input.name,
            description: input.description,
            client: input.client,
            expectedBudget: input.expectedBudget,
            cashData
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
    <Form
      title={pipe(
        props.project,
        option.fold(
          () => a18n`New Project`,
          project => project.name
        )
      )}
      headingAction={option.none}
      submit={submit}
      formError={formError}
      additionalButtons={[
        {
          type: 'button',
          label: a18n`Cancel`,
          icon: option.none,
          action: props.onCancel
        }
      ]}
    >
      <Input label={a18n`Name`} {...fieldProps('name')} />
      <TextArea label={a18n`Description`} {...fieldProps('description')} />
      <AsyncSelect
        label={a18n`Client`}
        {...fieldProps('client')}
        onQueryChange={props.findClients}
        emptyPlaceholder={a18n`No clients found`}
        codec={ObjectIdFromString}
      />

      <Input label={a18n`Expected budget`} {...fieldProps('expectedBudget')} />
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