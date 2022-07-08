import {
  ClientCreationInput,
  Country,
  CountryValues,
  Province,
  ProvinceValues,
  foldClientCreationInput,
  Client,
  foldClient,
  getClientName
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
import { Option } from 'fp-ts/Option'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'

interface Props {
  client: Option<Client>
  onSubmit: ReaderTaskEither<ClientCreationInput, LocalizedString, unknown>
  onCancel: IO<unknown>
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

export function ClientForm(props: Props) {
  const { fieldProps, submit, formError, values, setValues } = useForm(
    {
      initialValues: pipe(
        props.client,
        option.fold(
          () => ({
            type: 'BUSINESS' as FormType,
            fiscalCode: '',
            firstName: '',
            lastName: '',
            countryCode: toSelectState<Country>(CountryValues, option.none),
            vatNumber: '',
            businessName: '',
            addressCountry: toSelectState<Country>(CountryValues, option.none),
            addressProvince: toSelectState<Province>(
              ProvinceValues,
              option.none
            ),
            addressCity: '',
            addressZIP: '',
            addressStreet: '',
            addressStreetNumber: '',
            addressEmail: ''
          }),
          client => ({
            ...client,
            type:
              'firstName' in client
                ? ('PRIVATE' as const)
                : ('BUSINESS' as const),
            fiscalCode: pipe(
              client,
              foldClient(
                client => client.fiscalCode,
                () => ''
              )
            ),
            firstName: pipe(
              client,
              foldClient(
                client => client.firstName,
                () => ''
              )
            ),
            lastName: pipe(
              client,
              foldClient(
                client => client.lastName,
                () => ''
              )
            ),
            countryCode: toSelectState(
              CountryValues,
              pipe(
                client,
                foldClient(
                  () => option.none,
                  client => option.some(client.countryCode)
                )
              )
            ),
            vatNumber: pipe(
              client,
              foldClient(
                () => '',
                client => client.vatNumber
              )
            ),
            businessName: pipe(
              client,
              foldClient(
                () => '',
                client => client.businessName
              )
            ),
            addressCountry: toSelectState(
              CountryValues,
              option.some(client.addressCountry)
            ),
            addressProvince: toSelectState(
              ProvinceValues,
              option.some(client.addressProvince)
            ),
            addressStreetNumber: pipe(
              client.addressStreetNumber,
              option.getOrElse(() => '')
            )
          })
        )
      ),
      validators: ({ type }) => ({
        fiscalCode: pipe(
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
        firstName: pipe(
          type,
          foldFormType(
            () => validators.nonBlankString(commonErrors.nonBlank),
            constUndefined
          )
        ),
        lastName: pipe(
          type,
          foldFormType(
            () => validators.nonBlankString(commonErrors.nonBlank),
            constUndefined
          )
        ),
        countryCode: pipe(
          type,
          foldFormType(constUndefined, () =>
            validators.fromSelectState<Country>(
              a18n`This is not a valid country`
            )
          )
        ),
        vatNumber: pipe(
          type,
          foldFormType(constUndefined, () =>
            validators.nonBlankString(commonErrors.nonBlank)
          )
        ),
        businessName: pipe(
          type,
          foldFormType(constUndefined, () =>
            validators.nonBlankString(commonErrors.nonBlank)
          )
        ),
        addressCountry: validators.fromSelectState<Country>(
          a18n`This is not a valid country`
        ),
        addressProvince: validators.fromSelectState<Province>(
          a18n`This is not a valid province`
        ),
        addressCity: validators.nonBlankString(commonErrors.nonBlank),
        addressZIP: validators.nonBlankString(commonErrors.nonBlank),
        addressStreet: validators.nonBlankString(commonErrors.nonBlank),
        addressStreetNumber: validators.optionalString(),
        addressEmail: validators.fromCodec(
          EmailString,
          commonErrors.invalidEmail
        )
      }),
      linters: () => ({
        fiscalCode: fiscalCodeLinter,
        vatNumber: vatNumberLinter
      })
    },
    {
      onSubmit: data => {
        const commonData = {
          addressCountry: data.addressCountry,
          addressProvince: data.addressProvince,
          addressCity: data.addressCity,
          addressZIP: data.addressZIP,
          addressStreet: data.addressStreet,
          addressStreetNumber: data.addressStreetNumber,
          addressEmail: data.addressEmail
        }

        return pipe(
          data as ClientCreationInput,
          foldClientCreationInput<ClientCreationInput>(
            input => ({
              ...commonData,
              fiscalCode: input.fiscalCode,
              firstName: input.firstName,
              lastName: input.lastName
            }),
            input => ({
              ...commonData,
              countryCode: input.countryCode,
              vatNumber: input.vatNumber,
              businessName: input.businessName
            })
          ),
          props.onSubmit
        )
      }
    }
  )

  const onCountryChange = (addressCountry: SelectState<Country>) => {
    pipe(
      sequenceS(option.Apply)({
        country: getOptionValue(addressCountry),
        province: getOptionValue(values.addressProvince)
      }),
      option.fold(
        () => setValues({ addressCountry }),
        ({ country, province }) => {
          if (country === 'IT' && province === 'EE') {
            setValues({
              addressCountry,
              addressProvince: toSelectState(ProvinceValues, option.some('AG'))
            })
          } else if (country !== 'IT' && province !== 'EE') {
            setValues({
              addressCountry,
              addressProvince: toSelectState(ProvinceValues, option.some('EE'))
            })
          } else {
            setValues({ addressCountry })
          }
        }
      )
    )
  }

  const onProvinceChange = (addressProvince: SelectState<Province>) => {
    pipe(
      sequenceS(option.Apply)({
        province: getOptionValue(addressProvince),
        country: getOptionValue(values.addressCountry)
      }),
      option.fold(
        () => setValues({ addressProvince }),
        ({ province, country }) => {
          if (province === 'EE' && country === 'IT') {
            setValues({
              addressProvince,
              addressCountry: toSelectState(CountryValues, option.some('AD'))
            })
          } else if (province !== 'EE' && country !== 'IT') {
            setValues({
              addressProvince,
              addressCountry: toSelectState(CountryValues, option.some('IT'))
            })
          } else {
            setValues({ addressProvince })
          }
        }
      )
    )
  }

  const title = pipe(
    props.client,
    option.map(getClientName),
    option.getOrElse(() => a18n`New client`)
  )

  return (
    <Form
      title={title}
      headingAction={option.none}
      formError={formError}
      submit={submit}
      additionalButtons={[
        {
          type: 'button',
          label: a18n`Cancel`,
          icon: option.none,
          action: props.onCancel
        }
      ]}
    >
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
              <Input {...fieldProps('firstName')} label={a18n`First name`} />
              <Input {...fieldProps('lastName')} label={a18n`Last name`} />
              <Input
                {...fieldProps('fiscalCode')}
                label={a18n`Fiscal code`}
                value={fieldProps('fiscalCode').value.toUpperCase()}
              />
            </>
          ),
          () => (
            <>
              <Input
                {...fieldProps('businessName')}
                label={a18n`Business name`}
              />
              <Select
                type="default"
                {...fieldProps('countryCode')}
                label={a18n`Country`}
                options={CountryValues}
                codec={Country}
                emptyPlaceholder={a18n`No country found`}
              />
              <Input {...fieldProps('vatNumber')} label={a18n`VAT number`} />
            </>
          )
        )
      )}

      <Select
        type="default"
        {...fieldProps('addressCountry')}
        label={a18n`Address – country`}
        options={CountryValues}
        codec={Country}
        onChange={onCountryChange}
        emptyPlaceholder={a18n`No country found`}
      />
      <Select
        type="default"
        {...fieldProps('addressProvince')}
        label={a18n`Address – province`}
        options={ProvinceValues}
        codec={Province}
        onChange={onProvinceChange}
        emptyPlaceholder={a18n`No Province found`}
      />
      <Input {...fieldProps('addressCity')} label={a18n`Address – city`} />
      <Input {...fieldProps('addressZIP')} label={a18n`Address – ZIP code`} />
      <Input {...fieldProps('addressStreet')} label={a18n`Address – street`} />
      <Input
        {...fieldProps('addressStreetNumber')}
        label={a18n`Address – street number`}
      />
      <Input {...fieldProps('addressEmail')} label={a18n`E-mail address`} />
    </Form>
  )
}
