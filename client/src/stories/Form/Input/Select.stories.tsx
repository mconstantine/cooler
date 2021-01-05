import { Meta, Story } from '@storybook/react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { Select as SelectComponent } from '../../../components/Form/Input/Select/Select'
import { CoolerStory } from '../../CoolerStory'
import { Province, ProvinceValues } from '../../../entities/Client'
import { useState } from 'react'
import { boolean, option, record, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { LocalizedString } from '../../../globalDomain'
import * as t from 'io-ts'
import { Panel } from '../../../components/Panel/Panel'
import { TaskEither } from 'fp-ts/TaskEither'

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
  const [province, setProvince] = useState<Province>('MI')
  const [color, setColor] = useState<Color>('r')
  const [continent, setContinent] = useState<Continent>('africa')

  const provinceError: Option<LocalizedString> = pipe(
    Object.keys(ProvinceValues).includes(province),
    boolean.fold(
      () => option.some(unsafeLocalizedString('Not a province')),
      () => option.none
    )
  )

  const findContinent = (
    input: string
  ): TaskEither<LocalizedString, Record<string, LocalizedString>> => {
    const regex = new RegExp(input, 'i')

    return pipe(
      ContinentValues,
      record.filter(value => regex.test(value)),
      options => task.fromIO(() => options),
      task.delay(1000),
      taskEither.rightTask
    )
  }

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <SelectComponent
            name="province"
            label={unsafeLocalizedString('Province (default)')}
            value={province}
            options={ProvinceValues}
            onChange={province => setProvince(province as Province)}
            error={provinceError}
            warning={option.none}
          />

          <SelectComponent
            name="color"
            label={unsafeLocalizedString('Color (unsearchable)')}
            value={color}
            options={ColorValues}
            onChange={color => setColor(color as Color)}
            error={option.none}
            warning={option.none}
            unsearchable
          />

          <SelectComponent
            name="color"
            label={unsafeLocalizedString('Continent (async)')}
            value={continent}
            options={ContinentValues}
            onChange={continent => setContinent(continent as Continent)}
            error={option.none}
            warning={option.none}
            findOptions={findContinent}
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
