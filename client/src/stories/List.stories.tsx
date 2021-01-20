import { Meta, Story } from '@storybook/react'
import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/lib/pipeable'
import { Option } from 'fp-ts/Option'
import {
  batteryDead,
  checkmark,
  heart,
  skull,
  star,
  warning
} from 'ionicons/icons'
import { unsafeLocalizedString } from '../a18n'
import { Content } from '../components/Content/Content'
import { List } from '../components/List/List'
import { Percentage, unsafePercentage } from '../globalDomain'
import { CoolerStory } from './CoolerStory'

const description = unsafeLocalizedString(
  'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Corporis autem ex vel aliquid enim commodi laudantium esse eos eligendi ullam, ratione ipsam iste dolorem consectetur nesciunt at incidunt eveniet hic.'
)

interface Args {
  unwrapDescriptions: boolean
  details: boolean
  onClick: (input: any) => void
  showProgress: boolean
}

export const ReadonlyList: Story<Args> = ({ unwrapDescriptions }) => {
  return (
    <CoolerStory>
      <Content>
        <List
          heading={option.some(unsafeLocalizedString('Read-only list'))}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              type: 'readonly',
              label: option.none,
              content: unsafeLocalizedString('Content only item'),
              description: option.none
            },
            {
              key: 1,
              type: 'readonly',
              label: option.some(unsafeLocalizedString('Label')),
              content: unsafeLocalizedString('Label and content'),
              description: option.none
            },
            {
              key: 2,
              type: 'readonly',
              label: option.some(unsafeLocalizedString('Another label')),
              content: unsafeLocalizedString(
                'Label and content and description'
              ),
              description: option.some(description)
            },
            {
              key: 3,
              type: 'readonly',
              label: option.none,
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              disabled: true
            }
          ]}
        />
      </Content>
    </CoolerStory>
  )
}

export const ReadonlyListWithIcons: Story<Args> = ({ unwrapDescriptions }) => {
  return (
    <CoolerStory>
      <Content>
        <List
          heading={option.some(
            unsafeLocalizedString('Read-only list with icons at the start')
          )}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Default icon color'),
              description: option.none,
              icon: star,
              iconPosition: 'start',
              iconColor: 'default'
            },
            {
              key: 1,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Primary icon color'),
              description: option.none,
              icon: heart,
              iconPosition: 'start',
              iconColor: 'primary'
            },
            {
              key: 2,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Success icon color'),
              description: option.none,
              icon: checkmark,
              iconPosition: 'start',
              iconColor: 'success'
            },
            {
              key: 3,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Warning icon color'),
              description: option.none,
              icon: warning,
              iconPosition: 'start',
              iconColor: 'warning'
            },
            {
              key: 4,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Danger icon color'),
              description: option.none,
              icon: skull,
              iconPosition: 'start',
              iconColor: 'danger'
            },
            {
              key: 5,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              icon: batteryDead,
              iconPosition: 'start',
              iconColor: 'danger',
              disabled: true
            }
          ]}
        />

        <List
          heading={option.some(
            unsafeLocalizedString('Read-only list with icons at the end')
          )}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Default icon color'),
              description: option.none,
              icon: star,
              iconPosition: 'end',
              iconColor: 'default'
            },
            {
              key: 1,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Primary icon color'),
              description: option.none,
              icon: heart,
              iconPosition: 'end',
              iconColor: 'primary'
            },
            {
              key: 2,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Success icon color'),
              description: option.some(description),
              icon: checkmark,
              iconPosition: 'end',
              iconColor: 'success'
            },
            {
              key: 3,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Warning icon color'),
              description: option.some(description),
              icon: warning,
              iconPosition: 'end',
              iconColor: 'warning'
            },
            {
              key: 4,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Danger icon color'),
              description: option.some(description),
              icon: skull,
              iconPosition: 'end',
              iconColor: 'danger'
            },
            {
              key: 5,
              type: 'readonlyWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              icon: batteryDead,
              iconPosition: 'end',
              iconColor: 'danger',
              disabled: true
            }
          ]}
        />
      </Content>
    </CoolerStory>
  )
}

export const RoutedList: Story<Args> = ({
  unwrapDescriptions,
  onClick,
  details
}) => {
  return (
    <CoolerStory>
      <Content>
        <List
          heading={option.some(unsafeLocalizedString('Routed list'))}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              type: 'routed',
              label: option.none,
              content: unsafeLocalizedString('Content only item'),
              description: option.none,
              action: () => onClick(0),
              details
            },
            {
              key: 1,
              type: 'routed',
              label: option.some(unsafeLocalizedString('Label')),
              content: unsafeLocalizedString('Label and content'),
              description: option.none,
              action: () => onClick(1),
              details
            },
            {
              key: 2,
              type: 'routed',
              label: option.some(unsafeLocalizedString('Another label')),
              content: unsafeLocalizedString(
                'Label and content and description'
              ),
              description: option.some(description),
              action: () => onClick(2),
              details
            },
            {
              key: 3,
              type: 'routed',
              label: option.none,
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              action: () => onClick(2),
              details,
              disabled: true
            }
          ]}
        />
      </Content>
    </CoolerStory>
  )
}

export const RoutedListWithIcons: Story<Args> = ({
  unwrapDescriptions,
  onClick,
  details
}) => {
  return (
    <CoolerStory>
      <Content>
        <List
          heading={option.some(unsafeLocalizedString('Routed list with icons'))}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              type: 'routedWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Default icon color'),
              description: option.none,
              icon: star,
              iconPosition: 'start',
              iconColor: 'default',
              action: () => onClick(0),
              details
            },
            {
              key: 1,
              type: 'routedWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Primary icon color'),
              description: option.none,
              icon: heart,
              iconPosition: 'start',
              iconColor: 'primary',
              action: () => onClick(1),
              details
            },
            {
              key: 2,
              type: 'routedWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Success icon color'),
              description: option.some(description),
              icon: checkmark,
              iconPosition: 'start',
              iconColor: 'success',
              action: () => onClick(2),
              details
            },
            {
              key: 3,
              type: 'routedWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Warning icon color'),
              description: option.some(description),
              icon: warning,
              iconPosition: 'start',
              iconColor: 'warning',
              action: () => onClick(3),
              details
            },
            {
              key: 4,
              type: 'routedWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Danger icon color'),
              description: option.some(description),
              icon: skull,
              iconPosition: 'start',
              iconColor: 'danger',
              action: () => onClick(4),
              details
            },
            {
              key: 5,
              type: 'routedWithIcon',
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              icon: batteryDead,
              iconPosition: 'start',
              iconColor: 'danger',
              action: () => onClick(5),
              details,
              disabled: true
            }
          ]}
        />
      </Content>
    </CoolerStory>
  )
}

export const ReadonlyListWithValues: Story<Args> = ({
  unwrapDescriptions,
  showProgress
}) => {
  function getProgress(n: number): Option<Percentage> {
    return pipe(
      showProgress,
      boolean.fold(
        () => option.none,
        () => option.some(unsafePercentage(n))
      )
    )
  }

  return (
    <CoolerStory>
      <Content>
        <List
          heading={option.some(
            unsafeLocalizedString('Read-only list with values at the start')
          )}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              type: 'valued',
              label: option.some(
                unsafeLocalizedString('Item with value at the start')
              ),
              content: unsafeLocalizedString('Default color'),
              description: option.none,
              value: unsafeLocalizedString('20'),
              progress: getProgress(0.2)
            },
            {
              key: 1,
              type: 'valued',
              label: option.some(
                unsafeLocalizedString('Item with value at the start')
              ),
              content: unsafeLocalizedString('Primary color'),
              description: option.none,
              value: unsafeLocalizedString('40'),
              valueColor: 'primary',
              progress: getProgress(0.4)
            },
            {
              key: 2,
              type: 'valued',
              label: option.some(
                unsafeLocalizedString('Item with value at the start')
              ),
              content: unsafeLocalizedString('Success color'),
              description: option.none,
              value: unsafeLocalizedString('60'),
              valueColor: 'success',
              progress: getProgress(0.6)
            },
            {
              key: 3,
              type: 'valued',
              label: option.some(
                unsafeLocalizedString('Item with value at the start')
              ),
              content: unsafeLocalizedString('Warning color'),
              description: option.none,
              value: unsafeLocalizedString('80'),
              valueColor: 'warning',
              progress: getProgress(0.8)
            },
            {
              key: 4,
              type: 'valued',
              label: option.some(
                unsafeLocalizedString('Item with value at the start')
              ),
              content: unsafeLocalizedString('Danger color'),
              description: option.none,
              value: unsafeLocalizedString('100'),
              valueColor: 'danger',
              progress: getProgress(1)
            },
            {
              key: 5,
              type: 'valued',
              label: option.some(
                unsafeLocalizedString('Item with value at the start')
              ),
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              value: unsafeLocalizedString('42'),
              progress: getProgress(0.42),
              disabled: true
            }
          ]}
        />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta<Args> = {
  title: 'Cooler/List',
  args: {
    unwrapDescriptions: false,
    details: true,
    showProgress: false
  },
  argTypes: {
    onClick: {
      action: 'clicked'
    }
  }
}

export default meta
