import { TaskEither } from 'fp-ts/TaskEither'
import { FC } from 'react'
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
import {
  getOptionValue,
  Select,
  SelectState,
  toSelectState
} from '../Input/Select/Select'
import { commonErrors } from '../../../misc/commonErrors'
import { constUndefined, constVoid, flow, pipe } from 'fp-ts/function'
import { option } from 'fp-ts'
import { fiscalCodeLinter, vatNumberLinter } from '../../../misc/clientLinters'
import { Input } from '../Input/Input/Input'
import { sequenceS } from 'fp-ts/Apply'

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
  const { fieldProps, submit, formError } = useForm(
    {
      initialValues: {
        type: 'BUSINESS' as FormType,
        fiscal_code: '',
        first_name: '',
        last_name: '',
        country_code: toSelectState<Country>(CountryValues, option.none),
        vat_number: '',
        business_name: '',
        address_country: toSelectState<Country>(CountryValues, option.none),
        address_province: toSelectState<Province>(ProvinceValues, option.none),
        address_city: '',
        address_zip: '',
        address_street: '',
        address_street_number: '',
        address_email: ''
      },
      validators: ({ type }) => ({
        fiscal_code: pipe(
          type,
          foldFormType(
            () =>
              validators.inSequence(
                validators.toUpperCase(),
                validators.nonBlankString(commonErrors.nonBlank)
              ),
            constUndefined
          )
        ),
        first_name: pipe(
          type,
          foldFormType(
            () => validators.nonBlankString(commonErrors.nonBlank),
            constUndefined
          )
        ),
        last_name: pipe(
          type,
          foldFormType(
            () => validators.nonBlankString(commonErrors.nonBlank),
            constUndefined
          )
        ),
        country_code: pipe(
          type,
          foldFormType(constUndefined, () =>
            validators.fromSelectState<Country>(
              a18n`This is not a valid country`
            )
          )
        ),
        vat_number: pipe(
          type,
          foldFormType(constUndefined, () =>
            validators.nonBlankString(commonErrors.nonBlank)
          )
        ),
        business_name: pipe(
          type,
          foldFormType(constUndefined, () =>
            validators.nonBlankString(commonErrors.nonBlank)
          )
        ),
        address_country: validators.fromSelectState<Country>(
          a18n`This is not a valid country`
        ),
        address_province: validators.fromSelectState<Province>(
          a18n`This is not a valid province`
        ),
        address_city: validators.nonBlankString(commonErrors.nonBlank),
        address_zip: validators.nonBlankString(commonErrors.nonBlank),
        address_street: validators.nonBlankString(commonErrors.nonBlank),
        address_street_number: validators.optionalString(),
        address_email: validators.fromCodec(
          EmailString,
          commonErrors.invalidEmail
        )
      }),
      linters: () => ({
        fiscal_code: fiscalCodeLinter,
        vat_number: vatNumberLinter
      })
    },
    {
      onSubmit: data => {
        const commonData = {
          address_country: data.address_country,
          address_province: data.address_province,
          address_city: data.address_city,
          address_zip: data.address_zip,
          address_street: data.address_street,
          address_street_number: data.address_street_number,
          address_email: data.address_email
        }

        return pipe(
          data as ClientCreationInput,
          foldClientCreationInput<ClientCreationInput>(
            input => ({
              type: input.type,
              ...commonData,
              fiscal_code: input.fiscal_code,
              first_name: input.first_name,
              last_name: input.last_name
            }),
            input => ({
              type: input.type,
              ...commonData,
              country_code: input.country_code,
              vat_number: input.vat_number,
              business_name: input.business_name
            })
          ),
          onSubmit
        )
      }
    }
  )

  const { value: formType, onChange: setFormType } = fieldProps('type')

  const addressCountryProps = fieldProps('address_country')
  const addressProvinceProps = fieldProps('address_province')

  const onCountryChange = (countryOption: SelectState<Country>) => {
    addressCountryProps.onChange(countryOption)

    pipe(
      sequenceS(option.option)({
        country: getOptionValue(countryOption),
        province: getOptionValue(addressProvinceProps.value)
      }),
      option.fold(constVoid, ({ country, province }) => {
        if (country === 'IT' && province === 'EE') {
          addressProvinceProps.onChange(
            toSelectState(ProvinceValues, option.some('AG'))
          )
        } else if (country !== 'IT' && province !== 'EE') {
          addressProvinceProps.onChange(
            toSelectState(ProvinceValues, option.some('EE'))
          )
        }
      })
    )
  }

  const onProvinceChange = (provinceOption: SelectState<Province>) => {
    addressProvinceProps.onChange(provinceOption)

    pipe(
      sequenceS(option.option)({
        province: getOptionValue(provinceOption),
        country: getOptionValue(addressCountryProps.value)
      }),
      option.fold(constVoid, ({ province, country }) => {
        if (province === 'EE' && country === 'IT') {
          addressCountryProps.onChange(
            toSelectState(CountryValues, option.some('AD'))
          )
        } else if (province !== 'EE' && country !== 'IT') {
          addressCountryProps.onChange(
            toSelectState(CountryValues, option.some('IT'))
          )
        }
      })
    )
  }

  return (
    <Form title={a18n`New client`} formError={formError} submit={submit}>
      <Select
        type="unsearchable"
        name="formType"
        value={toSelectState(FormTypeValues, option.some(formType))}
        onChange={flow(getOptionValue, option.fold(constVoid, setFormType))}
        error={option.none}
        warning={option.none}
        label={a18n`Client type`}
        options={FormTypeValues}
        codec={FormType}
      />
      {pipe(
        formType,
        foldFormType(
          () => (
            <>
              <Input
                {...fieldProps('fiscal_code')}
                label={a18n`Fiscal code`}
                value={fieldProps('fiscal_code').value.toUpperCase()}
              />
              <Input {...fieldProps('first_name')} label={a18n`First name`} />
              <Input {...fieldProps('last_name')} label={a18n`Last name`} />
            </>
          ),
          () => (
            <>
              <Select
                type="default"
                {...fieldProps('country_code')}
                label={a18n`Country`}
                options={CountryValues}
                codec={Country}
                emptyPlaceholder={a18n`No country found`}
              />
              <Input {...fieldProps('vat_number')} label={a18n`VAT number`} />
              <Input
                {...fieldProps('business_name')}
                label={a18n`Business name`}
              />
            </>
          )
        )
      )}

      <h5>Address</h5>

      <Select
        type="default"
        {...addressCountryProps}
        label={a18n`Country`}
        options={CountryValues}
        codec={Country}
        onChange={onCountryChange}
        emptyPlaceholder={a18n`No country found`}
      />
      <Select
        type="default"
        {...addressProvinceProps}
        label={a18n`Province`}
        options={ProvinceValues}
        codec={Province}
        onChange={onProvinceChange}
        emptyPlaceholder={a18n`No Province found`}
      />
      <Input {...fieldProps('address_city')} label={a18n`City`} />
      <Input {...fieldProps('address_zip')} label={a18n`Zip code`} />
      <Input {...fieldProps('address_street')} label={a18n`Street`} />
      <Input
        {...fieldProps('address_street_number')}
        label={a18n`Street number`}
      />
      <Input {...fieldProps('address_email')} label={a18n`E-mail address`} />
    </Form>
  )
}
