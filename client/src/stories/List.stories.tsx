import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
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
import { CoolerStory } from './CoolerStory'

const description = unsafeLocalizedString(
  'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Corporis autem ex vel aliquid enim commodi laudantium esse eos eligendi ullam, ratione ipsam iste dolorem consectetur nesciunt at incidunt eveniet hic.'
)

export const Readonly: Story = ({ unwrapDescriptions }) => {
  return (
    <CoolerStory>
      <Content>
        <List
          type="readonly"
          heading={option.some(unsafeLocalizedString('Read-only list'))}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              label: option.none,
              content: unsafeLocalizedString('Content only item'),
              description: option.none
            },
            {
              key: 1,
              label: option.some(unsafeLocalizedString('Label')),
              content: unsafeLocalizedString('Label and content'),
              description: option.none
            },
            {
              key: 2,
              label: option.some(unsafeLocalizedString('Another label')),
              content: unsafeLocalizedString(
                'Label and content and description'
              ),
              description: option.some(description)
            },
            {
              key: 3,
              label: option.none,
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              disabled: true
            }
          ]}
        />
        <List
          type="readonlyWithIcon"
          iconsPosition="start"
          heading={option.some(
            unsafeLocalizedString('Read-only list with icons at the start')
          )}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Default icon color'),
              description: option.none,
              icon: star,
              iconColor: 'default'
            },
            {
              key: 1,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Primary icon color'),
              description: option.none,
              icon: heart,
              iconColor: 'primary'
            },
            {
              key: 2,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Success icon color'),
              description: option.none,
              icon: checkmark,
              iconColor: 'success'
            },
            {
              key: 3,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Warning icon color'),
              description: option.none,
              icon: warning,
              iconColor: 'warning'
            },
            {
              key: 4,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Danger icon color'),
              description: option.none,
              icon: skull,
              iconColor: 'danger'
            },
            {
              key: 5,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              icon: batteryDead,
              iconColor: 'danger',
              disabled: true
            }
          ]}
        />
        <List
          type="readonlyWithIcon"
          iconsPosition="end"
          heading={option.some(
            unsafeLocalizedString('Read-only list with icons at the end')
          )}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Default icon color'),
              description: option.none,
              icon: star,
              iconColor: 'default'
            },
            {
              key: 1,
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Primary icon color'),
              description: option.none,
              icon: heart,
              iconColor: 'primary'
            },
            {
              key: 2,
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Success icon color'),
              description: option.some(description),
              icon: checkmark,
              iconColor: 'success'
            },
            {
              key: 3,
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Warning icon color'),
              description: option.some(description),
              icon: warning,
              iconColor: 'warning'
            },
            {
              key: 4,
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Danger icon color'),
              description: option.some(description),
              icon: skull,
              iconColor: 'danger'
            },
            {
              key: 5,
              label: option.some(
                unsafeLocalizedString('Item with icon at the end')
              ),
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              icon: batteryDead,
              iconColor: 'danger',
              disabled: true
            }
          ]}
        />
      </Content>
    </CoolerStory>
  )
}

export const Routed: Story = ({ unwrapDescriptions, onClick }) => {
  return (
    <CoolerStory>
      <Content>
        <List
          type="routed"
          heading={option.some(unsafeLocalizedString('Routed list'))}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              label: option.none,
              content: unsafeLocalizedString('Content only item'),
              description: option.none,
              action: () => onClick(0)
            },
            {
              key: 1,
              label: option.some(unsafeLocalizedString('Label')),
              content: unsafeLocalizedString('Label and content'),
              description: option.none,
              action: () => onClick(1)
            },
            {
              key: 2,
              label: option.some(unsafeLocalizedString('Another label')),
              content: unsafeLocalizedString(
                'Label and content and description'
              ),
              description: option.some(description),
              action: () => onClick(2)
            },
            {
              key: 3,
              label: option.none,
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              action: () => onClick(2),
              disabled: true
            }
          ]}
        />
        <List
          type="routedWithIcon"
          heading={option.some(
            unsafeLocalizedString('Routed list with icons at the start')
          )}
          unwrapDescriptions={unwrapDescriptions}
          items={[
            {
              key: 0,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Default icon color'),
              description: option.none,
              icon: star,
              iconColor: 'default',
              action: () => onClick(0)
            },
            {
              key: 1,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Primary icon color'),
              description: option.none,
              icon: heart,
              iconColor: 'primary',
              action: () => onClick(1)
            },
            {
              key: 2,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Success icon color'),
              description: option.some(description),
              icon: checkmark,
              iconColor: 'success',
              action: () => onClick(2)
            },
            {
              key: 3,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Warning icon color'),
              description: option.some(description),
              icon: warning,
              iconColor: 'warning',
              action: () => onClick(3)
            },
            {
              key: 4,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Danger icon color'),
              description: option.some(description),
              icon: skull,
              iconColor: 'danger',
              action: () => onClick(4)
            },
            {
              key: 5,
              label: option.some(
                unsafeLocalizedString('Item with icon at the start')
              ),
              content: unsafeLocalizedString('Disabled'),
              description: option.none,
              icon: batteryDead,
              iconColor: 'danger',
              action: () => onClick(5),
              disabled: true
            }
          ]}
        />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/List',
  component: Readonly,
  args: {
    unwrapDescriptions: false
  },
  argTypes: {
    onClick: {
      action: 'clicked'
    }
  }
}

export default meta
