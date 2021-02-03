import { TaskEither } from 'fp-ts/TaskEither'
import { FC } from 'react'
import {
  ClientCreationInput,
  Country,
  CountryValues,
  Province,
  ProvinceValues,
  foldClientCreationInput,
  Client,
  foldClient
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
import { constUndefined, pipe } from 'fp-ts/function'
import { option } from 'fp-ts'
import { fiscalCodeLinter, vatNumberLinter } from '../../../misc/clientLinters'
import { Input } from '../Input/Input/Input'
import { sequenceS } from 'fp-ts/Apply'
import { SimpleSelect } from '../Input/SimpleSelect'
import { Heading } from '../../Heading/Heading'
import { Option } from 'fp-ts/Option'

interface Props {
  client: Option<Client>
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

export const ClientForm: FC<Props> = props => {
  const { fieldProps, submit, formError, values, setValues } = useForm(
    {
      initialValues: pipe(
        props.client,
        option.fold(
          () => ({
            type: 'BUSINESS' as FormType,
            fiscal_code: '',
            first_name: '',
            last_name: '',
            country_code: toSelectState<Country>(CountryValues, option.none),
            vat_number: '',
            business_name: '',
            address_country: toSelectState<Country>(CountryValues, option.none),
            address_province: toSelectState<Province>(
              ProvinceValues,
              option.none
            ),
            address_city: '',
            address_zip: '',
            address_street: '',
            address_street_number: '',
            address_email: ''
          }),
          client => ({
            ...client,
            fiscal_code: pipe(
              client,
              foldClient(
                client => client.fiscal_code,
                () => ''
              )
            ),
            first_name: pipe(
              client,
              foldClient(
                client => client.first_name,
                () => ''
              )
            ),
            last_name: pipe(
              client,
              foldClient(
                client => client.last_name,
                () => ''
              )
            ),
            country_code: toSelectState(
              CountryValues,
              pipe(
                client,
                foldClient(
                  () => option.none,
                  client => option.some(client.country_code)
                )
              )
            ),
            vat_number: pipe(
              client,
              foldClient(
                () => '',
                client => client.vat_number
              )
            ),
            business_name: pipe(
              client,
              foldClient(
                () => '',
                client => client.business_name
              )
            ),
            address_country: toSelectState(
              CountryValues,
              option.some(client.address_country)
            ),
            address_province: toSelectState(
              ProvinceValues,
              option.some(client.address_province)
            ),
            address_street_number: pipe(
              client.address_street_number,
              option.getOrElse(() => '')
            )
          })
        )
      ),
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
          props.onSubmit
        )
      }
    }
  )

  const onCountryChange = (address_country: SelectState<Country>) => {
    pipe(
      sequenceS(option.option)({
        country: getOptionValue(address_country),
        province: getOptionValue(values.address_province)
      }),
      option.fold(
        () => setValues({ address_country }),
        ({ country, province }) => {
          if (country === 'IT' && province === 'EE') {
            setValues({
              address_country,
              address_province: toSelectState(ProvinceValues, option.some('AG'))
            })
          } else if (country !== 'IT' && province !== 'EE') {
            setValues({
              address_country,
              address_province: toSelectState(ProvinceValues, option.some('EE'))
            })
          } else {
            setValues({ address_country })
          }
        }
      )
    )
  }

  const onProvinceChange = (address_province: SelectState<Province>) => {
    pipe(
      sequenceS(option.option)({
        province: getOptionValue(address_province),
        country: getOptionValue(values.address_country)
      }),
      option.fold(
        () => setValues({ address_province }),
        ({ province, country }) => {
          if (province === 'EE' && country === 'IT') {
            setValues({
              address_province,
              address_country: toSelectState(CountryValues, option.some('AD'))
            })
          } else if (province !== 'EE' && country !== 'IT') {
            setValues({
              address_province,
              address_country: toSelectState(CountryValues, option.some('IT'))
            })
          } else {
            setValues({ address_province })
          }
        }
      )
    )
  }

  return (
    <Form title={a18n`New client`} formError={formError} submit={submit}>
      <SimpleSelect
        label={a18n`Client type`}
        {...fieldProps('type')}
        options={FormTypeValues}
      />
      {pipe(
        values.type,
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

      <Heading size={24} action={option.none}>{a18n`Address`}</Heading>

      <Select
        type="default"
        {...fieldProps('address_country')}
        label={a18n`Country`}
        options={CountryValues}
        codec={Country}
        onChange={onCountryChange}
        emptyPlaceholder={a18n`No country found`}
      />
      <Select
        type="default"
        {...fieldProps('address_province')}
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
