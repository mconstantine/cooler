import { Meta, Story } from '@storybook/react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import {
  Select as SelectComponent,
  useSelectState
} from '../../../components/Form/Input/Select/Select'
import { CoolerStory } from '../../CoolerStory'
import { Province, ProvinceValues } from '../../../entities/Client'
import { useState } from 'react'
import { either, option, record, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { LocalizedString } from '../../../globalDomain'
import { Panel } from '../../../components/Panel/Panel'
import { NonEmptyString } from 'io-ts-types'

type SelectType = 'default' | 'unsearchable' | 'async'

function foldSelectType<T>(
  whenDefault: () => T,
  whenUnsearchable: () => T,
  whenAsync: () => T
): (type: SelectType) => T {
  return type => {
    switch (type) {
      case 'default':
        return whenDefault()
      case 'unsearchable':
        return whenUnsearchable()
      case 'async':
        return whenAsync()
    }
  }
}

interface Args {
  type: SelectType
  label: LocalizedString
  emptyPlaceholder: LocalizedString
  error: LocalizedString
  warning: LocalizedString
  disabled: boolean
}

const SelectTemplate: Story<Args> = props => {
  const [province, setProvince] = useSelectState<Province>(
    ProvinceValues,
    option.none
  )

  const [filteredProvinces, setFilteredProvinces] = useState<
    Partial<typeof ProvinceValues>
  >(ProvinceValues)

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)

  const findProvince = (input: string) => {
    setIsLoadingProvinces(true)

    const regex = new RegExp(input, 'i')

    return pipe(
      ProvinceValues,
      record.filter(value => regex.test(value)),
      options => task.fromIO(() => options),
      task.delay(1000),
      taskEither.rightTask,
      taskEither.chain(options =>
        taskEither.fromIO(() => {
          setIsLoadingProvinces(false)
          setFilteredProvinces(options)
        })
      )
    )()
  }

  const error: Option<LocalizedString> = pipe(
    props.error,
    NonEmptyString.decode,
    either.fold(
      () => option.none,
      () => option.some(props.error)
    )
  )

  const warning: Option<LocalizedString> = pipe(
    props.warning,
    NonEmptyString.decode,
    either.fold(
      () => option.none,
      () => option.some(props.warning)
    )
  )

  return (
    <CoolerStory>
      <Content>
        <Panel framed action={option.none}>
          {pipe(
            props.type,
            foldSelectType(
              () => (
                <SelectComponent
                  type="default"
                  name="province"
                  label={props.label}
                  value={province}
                  options={ProvinceValues}
                  onChange={setProvince}
                  error={error}
                  warning={warning}
                  emptyPlaceholder={props.emptyPlaceholder}
                  codec={Province}
                  disabled={props.disabled}
                />
              ),
              () => (
                <SelectComponent
                  type="unsearchable"
                  name="unsearchable"
                  label={props.label}
                  value={province}
                  options={ProvinceValues}
                  onChange={setProvince}
                  error={error}
                  warning={error}
                  codec={Province}
                  disabled={props.disabled}
                />
              ),
              () => (
                <SelectComponent
                  type="async"
                  name="async"
                  label={props.label}
                  value={province}
                  options={filteredProvinces}
                  onChange={setProvince}
                  error={error}
                  warning={warning}
                  onQueryChange={findProvince}
                  emptyPlaceholder={props.emptyPlaceholder}
                  isLoading={isLoadingProvinces}
                  codec={Province}
                  disabled={props.disabled}
                />
              )
            )
          )}
        </Panel>
      </Content>
    </CoolerStory>
  )
}

export const Select = SelectTemplate.bind({})

Select.args = {
  type: 'default',
  label: unsafeLocalizedString('Label'),
  emptyPlaceholder: unsafeLocalizedString('Nothing found!'),
  error: unsafeLocalizedString(''),
  warning: unsafeLocalizedString(''),
  disabled: false
}

Select.argTypes = {
  type: {
    name: 'Type',
    control: {
      type: 'select',
      options: {
        Default: 'default',
        Unsearchable: 'unsearchable',
        Asynchronous: 'async'
      } as Record<string, SelectType>
    }
  },
  label: {
    name: 'Label',
    control: 'text'
  },
  emptyPlaceholder: {
    name: 'Empty Placeholder',
    control: 'text',
    description: 'The text to be displayed when a search finds nothing'
  },
  error: {
    name: 'Error',
    control: 'text'
  },
  warning: {
    name: 'Warning',
    control: 'text'
  },
  disabled: {
    name: 'Disabled',
    control: 'boolean'
  }
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Select'
}

export default meta
