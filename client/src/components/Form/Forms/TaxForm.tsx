import { option } from 'fp-ts'
import { IO } from 'fp-ts/IO'
import { constUndefined, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { FC } from 'react'
import { a18n } from '../../../a18n'
import { Tax, TaxCreationInput } from '../../../entities/Tax'
import { LocalizedString, PercentageFromString } from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Body } from '../../Body/Body'
import { Form } from '../Form'
import { Input } from '../Input/Input/Input'
import { useForm } from '../useForm'
import * as validators from '../validators'

interface Props {
  tax: Option<Tax>
  onSubmit: ReaderTaskEither<TaxCreationInput, LocalizedString, unknown>
  onCancel: Option<IO<void>>
}

export const TaxForm: FC<Props> = props => {
  const { fieldProps, formError, submit } = useForm(
    {
      initialValues: pipe(
        props.tax,
        option.fold(
          () => ({
            label: '',
            value: ''
          }),
          tax => ({
            label: tax.label,
            value: PercentageFromString.encode(tax.value)
          })
        )
      ),
      validators: () => ({
        label: validators.nonBlankString(commonErrors.nonBlank),
        value: validators.fromCodec(
          PercentageFromString,
          a18n`Tax value should be a percentage`
        )
      }),
      linters: () => ({})
    },
    {
      onSubmit: data =>
        props.onSubmit({
          label: data.label.toString() as LocalizedString,
          value: data.value
        })
    }
  )

  const title = pipe(
    props.tax,
    option.fold(
      () => a18n`New Tax`,
      tax => tax.label
    )
  )

  return (
    <Form
      title={title}
      formError={formError}
      submit={submit}
      additionalButtons={pipe(
        props.onCancel,
        option.fold(constUndefined, onCancel => [
          {
            type: 'button',
            label: a18n`Cancel`,
            action: onCancel,
            icon: option.none
          }
        ])
      )}
    >
      <Input label={a18n`Name`} {...fieldProps('label')} />
      <Input label={a18n`Value (%)`} {...fieldProps('value')} />
      <Body>
        {a18n`Tax value is the percentage amount of your income you have to pay. For example, if you had to pay €25 every €100 earned, the value would be 25`}
      </Body>
    </Form>
  )
}
