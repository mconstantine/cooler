import { TaskEither } from 'fp-ts/TaskEither'
import { FC, useState } from 'react'
import {
  ClientCreationInput,
  Country,
  CountryValues,
  Province,
  ProvinceValues,
  foldClientCreationInput
} from '../../../entities/Client'
import { EmailString, LocalizedString } from '../../../globalDomain'
import * as t from 'io-ts'
import { a18n } from '../../../a18n'
import { useForm } from '../useForm'
import * as validators from '../validators'
import { Form } from '../Form'
import { Select } from '../Input/Select/Select'
import { commonErrors } from '../../../misc/commonErrors'
import { TextInput } from '../Input/TextInput/TextInput'
import { pipe } from 'fp-ts/function'
import { option } from 'fp-ts'
import { fiscalCodeLinter, vatNumberLinter } from '../../../misc/clientLinters'

interface Props {
  onSubmit: (
    client: ClientCreationInput
  ) => TaskEither<LocalizedString, unknown>
}

const FormTypeValues = {
  PRIVATE: a18n`Private`,
  BUSINESS: a18n`Business`
}

const FormType = t.keyof(FormTypeValues, 'FormType')
type FormType = t.TypeOf<typeof FormType>

function foldFormType<T>(
  whenPrivate: () => T,
  whenBusiness: () => T
): (formType: FormType) => T {
  return formType => {
    switch (formType) {
      case 'PRIVATE':
        return whenPrivate()
      case 'BUSINESS':
        return whenBusiness()
    }
  }
}

export const ClientForm: FC<Props> = ({ onSubmit }) => {
  const [formType, setFormType] = useState<FormType>('BUSINESS')
  const formValidator = validators.passThrough<
    Omit<ClientCreationInput, 'type'>
  >()

  const { fieldProps, submit, formError } = useForm({
    initialValues: {
      fiscal_code: '',
      first_name: '',
      last_name: '',
      country_code: '',
      vat_number: '',
      business_name: '',
      address_country: '',
      address_province: '',
      address_city: '',
      address_zip: '',
      address_street: '',
      address_street_number: '',
      address_email: ''
    },
    validators: {
      fiscal_code: pipe(
        formType,
        foldFormType(
          () =>
            validators.inSequence(
              validators.toUpperCase(),
              validators.nonBlankString(commonErrors.nonBlank)
            ),
          () => validators.passThrough()
        )
      ),
      first_name: pipe(
        formType,
        foldFormType(
          () => validators.nonBlankString(commonErrors.nonBlank),
          () => validators.passThrough()
        )
      ),
      last_name: pipe(
        formType,
        foldFormType(
          () => validators.nonBlankString(commonErrors.nonBlank),
          () => validators.passThrough()
        )
      ),
      country_code: pipe(
        formType,
        foldFormType(
          () => validators.passThrough(),
          () =>
            validators.fromCodec<Country>(
              Country,
              a18n`This is not a valid country`
            )
        )
      ),
      vat_number: pipe(
        formType,
        foldFormType(
          () => validators.passThrough(),
          () => validators.nonBlankString(commonErrors.nonBlank)
        )
      ),
      business_name: pipe(
        formType,
        foldFormType(
          () => validators.passThrough(),
          () => validators.nonBlankString(commonErrors.nonBlank)
        )
      ),
      address_country: validators.fromCodec<Country>(
        Country,
        a18n`This is not a valid country`
      ),
      address_province: validators.fromCodec<Province>(
        Province,
        a18n`This is not a valid province`
      ),
      address_city: validators.nonBlankString(commonErrors.nonBlank),
      address_zip: validators.nonBlankString(commonErrors.nonBlank),
      address_street: validators.nonBlankString(commonErrors.nonBlank),
      address_street_number: validators.optionalString(),
      address_email: validators.fromCodec<EmailString>(
        EmailString,
        commonErrors.invalidEmail
      )
    },
    linters: {
      fiscal_code: fiscalCodeLinter,
      vat_number: vatNumberLinter
    },
    formValidator,
    onSubmit: data =>
      pipe(
        { type: formType, ...data } as ClientCreationInput,
        foldClientCreationInput<ClientCreationInput>(
          input => ({
            type: input.type,
            fiscal_code: input.fiscal_code,
            first_name: input.first_name,
            last_name: input.last_name,
            address_country: input.address_country,
            address_province: input.address_province,
            address_city: input.address_city,
            address_zip: input.address_zip,
            address_street: input.address_street,
            address_street_number: input.address_street_number,
            address_email: input.address_email
          }),
          input => ({
            type: input.type,
            country_code: input.country_code,
            vat_number: input.vat_number,
            business_name: input.business_name,
            address_country: input.address_country,
            address_province: input.address_province,
            address_city: input.address_city,
            address_zip: input.address_zip,
            address_street: input.address_street,
            address_street_number: input.address_street_number,
            address_email: input.address_email
          })
        ),
        onSubmit
      )
  })

  const addressCountryProps = fieldProps('address_country')
  const addressProvinceProps = fieldProps('address_province')

  return (
    <Form title={a18n`New client`} formError={formError} submit={submit}>
      <Select
        name="formType"
        value={formType}
        onChange={formType => setFormType(formType as FormType)}
        error={option.none}
        warning={option.none}
        label={a18n`Client type`}
        options={FormTypeValues}
        unsearchable
      />
      {pipe(
        formType,
        foldFormType(
          () => (
            <>
              <TextInput
                {...fieldProps('fiscal_code')}
                label={a18n`Fiscal code`}
                value={fieldProps('fiscal_code').value.toUpperCase()}
              />
              <TextInput
                {...fieldProps('first_name')}
                label={a18n`First name`}
              />
              <TextInput {...fieldProps('last_name')} label={a18n`Last name`} />
            </>
          ),
          () => (
            <>
              <Select
                {...fieldProps('country_code')}
                label={a18n`Country`}
                options={CountryValues}
              />
              <TextInput
                {...fieldProps('vat_number')}
                label={a18n`VAT number`}
              />
              <TextInput
                {...fieldProps('business_name')}
                label={a18n`Business name`}
              />
            </>
          )
        )
      )}

      <h5>Address</h5>

      <Select
        {...addressCountryProps}
        label={a18n`Country`}
        options={CountryValues}
        onChange={country => {
          addressCountryProps.onChange(country)

          if (country === 'IT' && addressProvinceProps.value === 'EE') {
            addressProvinceProps.onChange('AG')
          } else if (country !== 'IT' && addressProvinceProps.value !== 'EE') {
            addressProvinceProps.onChange('EE')
          }
        }}
      />
      <Select
        {...addressProvinceProps}
        label={a18n`Province`}
        options={ProvinceValues}
        onChange={province => {
          addressProvinceProps.onChange(province)

          if (province === 'EE' && addressCountryProps.value === 'IT') {
            addressCountryProps.onChange('AD')
          } else if (province !== 'EE' && addressCountryProps.value !== 'IT') {
            addressCountryProps.onChange('IT')
          }
        }}
      />
      <TextInput {...fieldProps('address_city')} label={a18n`City`} />
      <TextInput {...fieldProps('address_zip')} label={a18n`Zip code`} />
      <TextInput {...fieldProps('address_street')} label={a18n`Street`} />
      <TextInput
        {...fieldProps('address_street_number')}
        label={a18n`Street number`}
      />
      <TextInput
        {...fieldProps('address_email')}
        label={a18n`E-mail address`}
      />
    </Form>
  )
}
