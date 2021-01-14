import { Meta, Story } from '@storybook/react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import {
  getOptionValue,
  Select as SelectComponent,
  useSelectState
} from '../../../components/Form/Input/Select/Select'
import { CoolerStory } from '../../CoolerStory'
import { Province, ProvinceValues } from '../../../entities/Client'
import { useState } from 'react'
import { option, record, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { LocalizedString } from '../../../globalDomain'
import { Panel } from '../../../components/Panel/Panel'
import * as t from 'io-ts'

const ColorValues = {
  r: unsafeLocalizedString('Red'),
  g: unsafeLocalizedString('Green'),
  b: unsafeLocalizedString('Blue'),
  c: unsafeLocalizedString('Cyan'),
  m: unsafeLocalizedString('Magenta'),
  y: unsafeLocalizedString('Yellow')
}
const Color = t.keyof(ColorValues)
type Color = t.TypeOf<typeof Color>

const ContinentValues = {
  africa: unsafeLocalizedString('Africa'),
  america: unsafeLocalizedString('America'),
  asia: unsafeLocalizedString('Asia'),
  europe: unsafeLocalizedString('Europe'),
  oceania: unsafeLocalizedString('Oceania')
}
const Continent = t.keyof(ContinentValues)
type Continent = t.TypeOf<typeof Continent>

export const Select: Story = () => {
  const [province, setProvince] = useSelectState<Province>(
    ProvinceValues,
    option.some('MI')
  )

  const [color, setColor] = useSelectState<Color>(ColorValues, option.some('r'))

  const [continent, setContinent] = useSelectState<Continent>(
    ContinentValues,
    option.some('africa')
  )

  const [continents, setContinents] = useState<Partial<typeof ContinentValues>>(
    ContinentValues
  )

  const [isLoadingContinents, setIsLoadingContinents] = useState(false)

  const provinceError: Option<LocalizedString> = pipe(
    getOptionValue(province),
    option.fold(
      () => option.some(unsafeLocalizedString('Not a province')),
      () => option.none
    )
  )

  const continentError: Option<LocalizedString> = pipe(
    getOptionValue(continent),
    option.fold(
      () => option.some(unsafeLocalizedString('Not a continent')),
      () => option.none
    )
  )

  const findContinent = (input: string) => {
    setIsLoadingContinents(true)

    const regex = new RegExp(input, 'i')

    return pipe(
      ContinentValues,
      record.filter(value => regex.test(value)),
      options => task.fromIO(() => options),
      task.delay(1000),
      taskEither.rightTask,
      taskEither.chain(options =>
        taskEither.fromIO(() => {
          setIsLoadingContinents(false)
          setContinents(options)
        })
      )
    )()
  }

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <SelectComponent
            type="default"
            name="province"
            label={unsafeLocalizedString('Province (default)')}
            value={province}
            options={ProvinceValues}
            onChange={setProvince}
            error={provinceError}
            warning={option.none}
            emptyPlaceholder={unsafeLocalizedString('No province found')}
            codec={Province}
          />

          <SelectComponent
            type="unsearchable"
            name="color"
            label={unsafeLocalizedString('Color (unsearchable)')}
            value={color}
            options={ColorValues}
            onChange={setColor}
            error={option.none}
            warning={option.none}
            codec={Color}
          />

          <SelectComponent
            type="async"
            name="continent"
            label={unsafeLocalizedString('Continent (async)')}
            value={continent}
            options={continents}
            onChange={setContinent}
            error={continentError}
            warning={option.none}
            onQueryChange={findContinent}
            emptyPlaceholder={unsafeLocalizedString('No continents found')}
            isLoading={isLoadingContinents}
            codec={Continent}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Select'
}

export default meta
