import { Meta, Story } from '@storybook/react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { Select as SelectComponent } from '../../../components/Form/Input/Select/Select'
import { CoolerStory } from '../../CoolerStory'
import {
  Country,
  CountryValues,
  Province,
  ProvinceValues
} from '../../../entities/Client'
import { useState } from 'react'
import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { LocalizedString } from '../../../globalDomain'
import { Separator } from '../../../components/Separator/Separator'
import { Button } from '../../../components/Button/Button/Button'

export const Select: Story = () => {
  const [province, setProvince] = useState<Province>('MI')
  const [country, setCountry] = useState<Country>('IT')

  const provinceError: Option<LocalizedString> = pipe(
    Object.keys(ProvinceValues).includes(province),
    boolean.fold(
      () => option.some(unsafeLocalizedString('Not a province')),
      () => option.none
    )
  )

  const countryError: Option<LocalizedString> = pipe(
    Object.keys(CountryValues).includes(country),
    boolean.fold(
      () => option.some(unsafeLocalizedString('Not a country')),
      () => option.none
    )
  )

  return (
    <CoolerStory>
      <Content>
        <SelectComponent
          name="province"
          label={unsafeLocalizedString('Province')}
          value={province}
          options={ProvinceValues}
          onChange={province => {
            setProvince(province as Province)

            if (province === 'EE' && country === 'IT') {
              setCountry('AD')
            } else if (province !== 'EE' && country !== 'IT') {
              setCountry('IT')
            }
          }}
          error={provinceError}
          warning={option.none}
        />

        <SelectComponent
          name="country"
          label={unsafeLocalizedString('Country')}
          value={country}
          options={CountryValues}
          onChange={country => {
            setCountry(country as Country)

            if (country === 'IT' && province === 'EE') {
              setProvince('AG')
            } else if (country !== 'IT' && province !== 'EE') {
              setProvince('EE')
            }
          }}
          error={countryError}
          warning={
            country === 'FR'
              ? option.some(unsafeLocalizedString('Warning: France sucks!'))
              : option.none
          }
        />

        <Separator />

        <Button
          type="button"
          label={unsafeLocalizedString('Show a warning')}
          icon={option.none}
          action={() => {
            setProvince('EE')
            setCountry('FR')
          }}
        />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Select'
}

export default meta
